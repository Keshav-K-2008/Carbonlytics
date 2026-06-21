import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

let app;
let query;
let token;

beforeAll(async () => {
  process.env.DATABASE_URL = '';
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_123456';
  
  // Clear API keys to prevent hitting external rate-limited endpoints during unit tests
  process.env.CLIMATIQ_API_KEY = '';
  process.env.NEWS_API_KEY = '';
  process.env.OPENWEATHER_API_KEY = '';
  
  const appModule = await import('../server.js');
  app = appModule.default;

  const dbModule = await import('../config/db.js');
  query = dbModule.query;

  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Clean up and register a test user for API routes requiring authentication
  await query("DELETE FROM users WHERE email = 'apiuser@test.com'");
  
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'apiuser@test.com',
      password: 'Password123!',
      fullName: 'API Test User'
    });
    
  token = registerRes.body.token;
});

describe('General & Weather APIs', () => {
  it('should successfully get root API status', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('version');
  });

  it('should fail fetching weather without authentication', async () => {
    const res = await request(app).get('/api/weather?lat=12.97&lon=77.59');
    expect(res.statusCode).toBe(401);
  });

  it('should successfully fetch weather and AQI with valid coordinates', async () => {
    const res = await request(app)
      .get('/api/weather?lat=12.97&lon=77.59')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('weather');
    expect(res.body.data).toHaveProperty('airQuality');
  });

  it('should successfully fetch climate news', async () => {
    const res = await request(app)
      .get('/api/news')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('title');
      expect(res.body.data[0]).toHaveProperty('description');
    }
  });
});

describe('Carbon Calculator & Activities API', () => {
  it('should successfully log a carbon activity', async () => {
    const activityPayload = {
      category: 'transportation',
      subcategory: 'car_petrol',
      amount: 15, // 15 km
      description: 'Daily commute'
    };

    const res = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send(activityPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.category).toBe(activityPayload.category);
    expect(res.body.data.subcategory).toBe(activityPayload.subcategory);
    expect(Number(res.body.data.calculatedEmissions)).toBeGreaterThan(0);
  });

  it('should successfully retrieve user carbon activities', async () => {
    const res = await request(app)
      .get('/api/activities')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
