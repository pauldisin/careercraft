import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';
import crypto from 'crypto';
import { db, users, transactions, paymentVerifications } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Mock Stripe integration using Vitest
const mockStripe = {
  webhooks: {
    constructEvent: (body: any, sig: any, secret: any) => {
      if (sig === 'valid_mock_signature') {
        const parsed = JSON.parse(body.toString());
        return parsed;
      }
      throw new Error('Stripe signature verification failed');
    }
  },
  checkout: {
    sessions: {
      create: async () => ({ url: 'https://checkout.stripe.test/mock-session' })
    }
  },
  customers: {
    create: async () => ({ id: 'cus_stripe_mock_123' })
  },
  billingPortal: {
    sessions: {
      create: async () => ({ url: 'https://billing.stripe.test/mock-session' })
    }
  }
};

vi.mock('../../src/lib/stripe', () => {
  return {
    getStripe: async () => mockStripe
  };
});

describe('Payment & Stripe Lifecycle Integration Tests', () => {
  let app: any;
  let testUser: any;
  let testUserToken: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    // Inject mock secrets so endpoints don't reject requests
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_123';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_high_entropy_32_characters';
    
    app = await createApp();
    
    const userId = `payment_test_${crypto.randomUUID()}`;
    [testUser] = await db.insert(users).values({
      id: userId,
      email: `payment_test_${Date.now()}@example.com`,
      password_hash: 'hashedPassword',
      name: 'Payment Tester',
      stripe_customer_id: 'cus_stripe_mock_123',
      credits: 2
    }).returning();

    createdUserIds.push(userId);
    const { signToken } = await import('../../src/lib/jwt');
    testUserToken = await signToken(testUser.id, testUser.email);
  });

  afterAll(async () => {
    // Delete all testing traces
    for (const userId of createdUserIds) {
      await db.delete(paymentVerifications).where(eq(paymentVerifications.user_id, userId));
      await db.delete(transactions).where(eq(transactions.user_id, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  it('should return 400 for invalid signature on webhooks', async () => {
    const payload = { type: 'checkout.session.completed', data: { object: {} } };
    
    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Stripe-Signature', 'invalid_signature')
      .send(JSON.stringify(payload));
      
    expect(res.status).toBe(400);
  });

  it('should successfully submit manual payment verification', async () => {
    const res = await request(app)
      .post('/api/payments/manual')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        plan: 'premium',
        type: 'payment',
        method: 'wantok',
        receiptNumber: '9988776655',
        amountStr: 'K59.00',
        screenshotUrl: 'https://example.com/screenshot.png'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should process checkout.session.completed for a new subscription plan', async () => {
    const payload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: testUser.id,
          customer: 'cus_stripe_mock_123',
          id: `cs_test_${crypto.randomUUID()}`,
          amount_total: 7500,
          currency: 'pgk',
          metadata: {
            plan: 'pro',
            type: 'subscription'
          }
        }
      }
    };

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Stripe-Signature', 'valid_mock_signature')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    // Verify user database record has active subscription
    const [updatedUser] = await db.select().from(users).where(eq(users.id, testUser.id));
    expect(updatedUser.subscription_status).toBe('active');
    expect(updatedUser.subscription_plan).toBe('pro');

    // Verify transaction history is stored
    const userTransactions = await db.select().from(transactions).where(eq(transactions.user_id, testUser.id));
    expect(userTransactions.length).toBeGreaterThan(0);
  });

  it('should process checkout.session.completed for a single purchase adding credits', async () => {
    const payload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: testUser.id,
          customer: 'cus_stripe_mock_123',
          id: `cs_test_${crypto.randomUUID()}`,
          amount_total: 3900,
          currency: 'pgk',
          metadata: {
            plan: 'bundle', // 'bundle' triggers +3 credits Addition rule
            type: 'payment'
          }
        }
      }
    };

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Stripe-Signature', 'valid_mock_signature')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload));

    expect(res.status).toBe(200);

    // In beforeAll, testUser started with 2 credits. Webhook adds 3 credits for bundle -> ends at 5.
    const [updatedUser] = await db.select().from(users).where(eq(users.id, testUser.id));
    expect(updatedUser.credits).toBe(5);
  });

  it('should process invoice.past_due or payment failed correctly', async () => {
    const payload = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: 'cus_stripe_mock_123',
          id: `in_test_${crypto.randomUUID()}`
        }
      }
    };

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Stripe-Signature', 'valid_mock_signature')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload));

    expect(res.status).toBe(200);

    // Verify status updated to past_due
    const [updatedUser] = await db.select().from(users).where(eq(users.id, testUser.id));
    expect(updatedUser.subscription_status).toBe('past_due');
  });

  it('should process customer.subscription.deleted correctly', async () => {
    const payload = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_stripe_mock_123'
        }
      }
    };

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Stripe-Signature', 'valid_mock_signature')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload));

    expect(res.status).toBe(200);

    // Verify status updated to inactive
    const [updatedUser] = await db.select().from(users).where(eq(users.id, testUser.id));
    expect(updatedUser.subscription_status).toBe('inactive');
    expect(updatedUser.subscription_plan).toBe('none');
  });

  it('should successfully establish online Stripe Checkout sessions', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        plan: 'premium',
        type: 'payment'
      });

    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
    expect(res.body.url).toContain('checkout.stripe.test');
  });

  it('should successfully launch billing-portal redirection url', async () => {
    const res = await request(app)
      .post('/api/billing-portal')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
    expect(res.body.url).toContain('billing.stripe.test');
  });
});
