import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

let app;
let query;

beforeAll(async () => {
  // Force local SQLite database fallback for testing to avoid polluting production Postgres
  process.env.DATABASE_URL = '';
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_123456';
  
  // Clear API keys to prevent hitting external rate-limited endpoints during unit tests
  process.env.CLIMATIQ_API_KEY = '';
  process.env.NEWS_API_KEY = '';
  process.env.OPENWEATHER_API_KEY = '';
  
  // Dynamically import the app and query after setting env variables
  const appModule = await import('../server.js');
  app = appModule.default;

  const dbModule = await import('../config/db.js');
  query = dbModule.query;

  // Wait a small amount of time for SQLite schema and seeds to initialize
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Clean up any test users
  await query("DELETE FROM users WHERE email LIKE '%@test.com'");
});

describe('Authentication API', () => {
  const testUser = {
    email: 'testuser@test.com',
    password: 'Password123!',
    fullName: 'Test User'
  };

  it('should successfully register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.fullName).toBe(testUser.fullName);
    expect(res.body).toHaveProperty('token');
  });

  it('should fail registration with an existing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully log in the registered user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fail login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@test.com',
        password: testUser.password
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
