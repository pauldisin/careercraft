import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';
import { signToken } from '../../src/lib/jwt';
import { db, users } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Mock the GoogleGenAI class to behave deterministically and avoid hitting the real API or failing on quotas
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      constructor(options: any) {
        if (!options || !options.apiKey) {
          throw new Error('API key must be provided');
        }
      }
      models = {
        generateContent: async ({ model, contents }: any) => {
          if (contents && contents.includes('trigger-error')) {
            throw new Error('Mock AI Generation Failure');
          }
          return {
            text: 'Mocked successful AI content response.',
            usageMetadata: { totalTokenCount: 42 }
          };
        }
      };
    },
    Type: {
      STRING: 'STRING',
      OBJECT: 'OBJECT'
    }
  };
});

describe('AI Generation & Credit Deduction Endpoints', () => {
  let app: any;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    // Ensure we have a fake GEMINI_API_KEY set for testing so getAiClient doesn't throw
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'fake_test_gemini_api_key_123';
    app = await createApp();
  });

  afterAll(async () => {
    // Clean up all users created during this test suite
    for (const userId of createdUserIds) {
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  async function createTestUser(credits: number, subscriptionStatus: string = 'inactive') {
    const id = `ai_test_${crypto.randomUUID()}`;
    const email = `ai_test_${id}@example.com`;
    
    const [user] = await db.insert(users).values({
      id,
      email,
      password_hash: 'hashed',
      name: 'Credit Test User',
      credits,
      subscription_status: subscriptionStatus,
      subscription_plan: subscriptionStatus === 'active' ? 'pro' : 'none'
    }).returning();

    createdUserIds.push(id);
    const token = await signToken(user.id, user.email);
    return { user, token };
  }

  it('should return 401 if unauthenticated', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .send({ prompt: 'Hello AI' });
      
    expect(res.status).toBe(401);
  });

  it('should return 400 for missing prompt', async () => {
    const { token } = await createTestUser(10);
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({});
      
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('should not deduct credits for non-document types (e.g., standard/analysis prompts)', async () => {
    const { user, token } = await createTestUser(5);
    
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        prompt: 'Analyze my skills list.',
        type: 'analysis'
      });

    expect(res.status).toBe(200);
    expect(res.body.text).toContain('Mocked successful AI content response');

    // Verify credits remained unchanged
    const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
    expect(updatedUser.credits).toBe(5);
  });

  it('should deduct exactly 1 credit for a trial user generating a full document (e.g., resume)', async () => {
    const { user, token } = await createTestUser(3);

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        prompt: 'Build my resume content based on experience.',
        type: 'resume'
      });

    expect(res.status).toBe(200);
    expect(res.body.text).toBeDefined();

    // Verify credits are decremented by 1 (3 -> 2)
    const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
    expect(updatedUser.credits).toBe(2);
  });

  it('should deny request (403) and not call AI if active credits is 0 and user is not a subscriber', async () => {
    const { user, token } = await createTestUser(0); // 0 credits

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        prompt: 'Build my cover letter.',
        type: 'cover_letter'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('No credits remaining');

    // Confirm credits remain 0
    const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
    expect(updatedUser.credits).toBe(0);
  });

  it('should NOT deduct credits for document generation if user has an active premium subscription', async () => {
    // 0 credits but subscription is active
    const { user, token } = await createTestUser(0, 'active');

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        prompt: 'Generate my complete professional resume.',
        type: 'resume'
      });

    expect(res.status).toBe(200);
    expect(res.body.text).toBeDefined();

    // Confirm credits remained at 0
    const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
    expect(updatedUser.credits).toBe(0);
  });

  it('should refund the deducted credit back to the user if the AI execution fails', async () => {
    const { user, token } = await createTestUser(4);

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        prompt: 'This will trigger-error during generation.',
        type: 'resume' // full document triggers credit prepay
      });

    expect(res.status).toBe(500);

    // Confirm that the credit was refunded, ending back at the original balance of 4
    const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
    expect(updatedUser.credits).toBe(4);
  });
});
