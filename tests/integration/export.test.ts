import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Mock config to ensure the rate limit in tests is exactly 2 requests per minute
vi.mock('../../config.ts', async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    config: {
      ...original.config,
      export: {
        rateLimitWindowMs: 60000,
        rateLimitMaxRequests: 2
      }
    }
  };
});

import { createApp } from '../../server';
import { signToken } from '../../src/lib/jwt';
import { db, users } from '../../db/schema';
import { eq } from 'drizzle-orm';

describe('Export Rate Limiter', () => {
  let app: any;
  let testToken: string;
  let user: any;

  beforeAll(async () => {
    app = await createApp();
    
    // Create a dummy user for tests
    const timestamp = Date.now();
    [user] = await db.insert(users).values({
      id: `export_test_${timestamp}`,
      email: `export_test_${timestamp}@example.com`,
      password_hash: 'hashed',
      name: 'Export Tester',
      credits: 100
    }).returning();
    
    testToken = await signToken(user.id, user.email);
  });

  afterAll(async () => {
    if (user && user.id) {
      await db.delete(users).where(eq(users.id, user.id));
    }
  });

  it('should rate limit after max requests has been exceeded', async () => {
    const exportData = {
      type: 'cover_letter',
      markdown: '# Cover Letter\n\nThis is a test cover letter.\n',
      template: 'modern',
      accentColor: '#4f46e5',
      fontFamily: 'Inter'
    };

    // First request should succeed
    const res1 = await request(app)
      .post('/api/export/txt')
      .set('Authorization', `Bearer ${testToken}`)
      .send(exportData);
    expect(res1.status).toBe(200);

    // Second request should succeed
    const res2 = await request(app)
      .post('/api/export/txt')
      .set('Authorization', `Bearer ${testToken}`)
      .send(exportData);
    expect(res2.status).toBe(200);

    // Third request should be blocked by rate limiting (429)
    const res3 = await request(app)
      .post('/api/export/txt')
      .set('Authorization', `Bearer ${testToken}`)
      .send(exportData);
    expect(res3.status).toBe(429);
    expect(res3.body).toHaveProperty('error');
    expect(res3.body.error).toContain('Too many export requests');
  });
});
