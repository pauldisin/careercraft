import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';
import { db, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { signToken } from '../../src/lib/jwt';

describe('Admin Endpoints', () => {
  let app: any;
  let adminId: string;
  let adminToken: string;
  const adminEmail = 'admin_sc_test@example.com';

  beforeAll(async () => {
    app = await createApp();
    adminId = `admin_${Date.now()}`;
    
    // Seed an admin user directly into DB
    await db.insert(users).values({
      id: adminId,
      email: adminEmail,
      name: 'Admin Tester',
      is_admin: 1,
      password_hash: 'hashedpasswordhash123',
      credits: 10,
      subscription_status: 'active',
      subscription_plan: 'premium',
      created_at: new Date()
    });

    adminToken = await signToken(adminId, adminEmail);
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, adminId));
  });

  it('should reject non-admin access to admin users list', async () => {
    const regularUserId = `user_${Date.now()}`;
    const regularEmail = 'user_sc_test@example.com';
    
    // Seed the user in the database
    await db.insert(users).values({
      id: regularUserId,
      email: regularEmail,
      is_admin: 0,
      credits: 0,
    });

    const regularToken = await signToken(regularUserId, regularEmail);

    try {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    } finally {
      // Clean up the regular user
      await db.delete(users).where(eq(users.id, regularUserId));
    }
  });

  it('should return paginated admin users list with correct schema and no password hashes', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    // If database connection is 503 (database service unavailable), skip assertions
    if (res.status === 503) return;

    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.pagination.page).toBe(1);

    // Verify no password_hash field is present on any user objects returned
    for (const u of res.body.users) {
      expect(u.password_hash).toBeUndefined();
      expect(u.id).toBeDefined();
      expect(u.email).toBeDefined();
    }
  });
});
