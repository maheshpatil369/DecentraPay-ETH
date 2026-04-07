'use strict';
const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../app');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

const TEST_USER = {
  fullName:      'Test User',
  email:         'test@decentrapay.dev',
  password:      'Password1',
  username:      'testuser99',
  walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  pin:           '1234',
};

describe('Auth', () => {
  let token;

  it('POST /api/auth/register → 201', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('POST /api/auth/register duplicate → 409', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/login → 200', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ emailOrUsername: TEST_USER.email, password: TEST_USER.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('POST /api/auth/login wrong password → 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ emailOrUsername: TEST_USER.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me → 200', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('testuser99');
  });

  it('GET /api/auth/me no token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Users', () => {
  let token;

  beforeAll(async () => {
    const login = await request(app).post('/api/auth/login')
      .send({ emailOrUsername: TEST_USER.email, password: TEST_USER.password });
    token = login.body.token;
  });

  it('GET /api/users/testuser99 → 200', async () => {
    const res = await request(app).get('/api/users/testuser99')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('testuser99');
  });

  it('GET /api/users/search?username=test → 200', async () => {
    const res = await request(app).get('/api/users/search?username=test')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  it('GET /api/users/unknownxyz → 404', async () => {
    const res = await request(app).get('/api/users/unknownxyz')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('Security', () => {
  let token;

  beforeAll(async () => {
    const login = await request(app).post('/api/auth/login')
      .send({ emailOrUsername: TEST_USER.email, password: TEST_USER.password });
    token = login.body.token;
  });

  it('POST /api/security/verify-pin correct → 200', async () => {
    const res = await request(app).post('/api/security/verify-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ pin: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/security/verify-pin wrong → 401', async () => {
    const res = await request(app).post('/api/security/verify-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ pin: '9999' });
    expect(res.status).toBe(401);
  });

  it('POST /api/security/set-pin → 200', async () => {
    const res = await request(app).post('/api/security/set-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ pin: '5678' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
