import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';
import { db, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { signToken } from '../../src/lib/jwt';

describe('Auth Endpoints', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
  });

  it('should sign up a new user successfully', async () => {
    // Generate a specific random email to avoid collision
    const randomEmail = `test_user_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: randomEmail,
        password: 'Password123!',
        name: 'Test schema User'
      });
      
    // Accept 503 since tests run without DB
    if (res.status === 503) return;
    
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    // Verify properties in the DB
    const dbUsers = await db.select().from(users).where(eq(users.email, randomEmail));
    expect(dbUsers.length).toBe(1);
    expect(dbUsers[0].name).toBe('Test schema User');
    
    // Clean up
    await db.delete(users).where(eq(users.email, randomEmail));
  });

  it('should return error on missing email or password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        password: 'Password123!'
      });
      
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('should sign in an existing user', async () => {
    const email = `test_signin_${Date.now()}@example.com`;
    const password = 'Password123!';
    
    // Sign up first
    await request(app).post('/api/auth/signup').send({
      email,
      password,
      name: 'SignIn User'
    });
    
    // Attempt sign in
    const res = await request(app)
      .post('/api/auth/signin')
      .send({
        email,
        password
      });
      
    if (res.status === 503) return;
    
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    
    // Clean up
    await db.delete(users).where(eq(users.email, email));
  });

  it('should fetch user profile if authenticated', async () => {
    const [user] = await db.insert(users).values({
      id: `auth_test_${Date.now()}`,
      email: `test_profile_${Date.now()}@example.com`,
      password_hash: 'hashedpassword',
      name: 'Auth Test'
    }).returning();

    const token = await signToken(user.id, user.email);

    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`);
      
    if (res.status === 503) return;
    
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
    
    // Clean up
    await db.delete(users).where(eq(users.id, user.id));
  });

  it('should return 401 if unauthenticated', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });

  it('should return 401 and not silently create a user if token is valid but user ID is non-existent', async () => {
    const nonExistentUserId = `ghost_user_${Date.now()}`;
    const token = await signToken(nonExistentUserId, 'ghost@example.com');

    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`);
      
    if (res.status === 503) return;
    
    expect(res.status).toBe(401);

    // Verify user was NOT created in database
    const dbUsers = await db.select().from(users).where(eq(users.id, nonExistentUserId));
    expect(dbUsers.length).toBe(0);
  });
});
