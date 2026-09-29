import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase, getDatabase } from '../src/database/index.js';

let app: any;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDatabase();
  app = createApp();
});

afterAll(async () => {
  const db = getDatabase();
  await db.destroy();
});

describe('Phase 2: Backend Foundation, Authentication, RBAC & Customer Approval', () => {
  const customerPhone = '01712345678';
  const customerPassword = 'Password@123';
  let customerAccessToken: string;
  let customerRefreshToken: string;
  let customerId: string;

  let adminAccessToken: string;

  test('1. GET /api/v1/health should return ok and connected database', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');
  });

  test('2. POST /api/v1/auth/register should create customer with status PENDING_APPROVAL', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Test Customer Rahim',
        phone: customerPhone,
        password: customerPassword,
        confirmPassword: customerPassword,
        address: 'House 15, Road 2, Banani, Dhaka',
        email: 'rahim@test.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.phone).toBe(customerPhone);
    expect(res.body.data.user.status).toBe('PENDING_APPROVAL');
    expect(res.body.data.user.role).toBe('CUSTOMER');
    customerId = res.body.data.user.id;
  });

  test('3. POST /api/v1/auth/register should reject duplicate phone with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Duplicate Rahim',
        phone: customerPhone,
        password: customerPassword,
        confirmPassword: customerPassword,
        address: 'Dhaka',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('PHONE_ALREADY_EXISTS');
  });

  test('4. POST /api/v1/auth/register should fail validation on mismatched passwords', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Invalid User',
        phone: '01899999999',
        password: 'Password123',
        confirmPassword: 'Password456',
        address: 'Dhaka',
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('5. POST /api/v1/auth/login allows customer login and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: customerPhone,
        password: customerPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.status).toBe('PENDING_APPROVAL');
    expect(res.body.data.user.isApproved).toBe(false);

    customerAccessToken = res.body.data.accessToken;
    customerRefreshToken = res.body.data.refreshToken;
  });

  test('6. Customer Approval Guard: PENDING_APPROVAL customer cannot perform shopping operations', async () => {
    const res = await request(app)
      .get('/api/v1/customers/shopping-check')
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('ACCOUNT_PENDING_APPROVAL');
  });

  test('7. Super Admin Login with default seeded credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '01700000000',
        password: 'Admin@123456',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('SUPER_ADMIN');
    adminAccessToken = res.body.data.accessToken;
  });

  test('8. Admin lists customers with status PENDING_APPROVAL', async () => {
    const res = await request(app)
      .get('/api/v1/admin/customers?status=PENDING_APPROVAL')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((c: any) => c.phone === customerPhone);
    expect(found).toBeDefined();
    expect(found.status).toBe('PENDING_APPROVAL');
  });

  test('9. Admin approves customer account', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/customers/${customerId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        status: 'APPROVED',
        reason: 'Customer identity and address verified.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.data.approved_at).toBeDefined();
  });

  test('10. Approved customer can now perform shopping operations', async () => {
    // Relogin to refresh token claim or use current token since guard reads live status
    const res = await request(app)
      .get('/api/v1/customers/shopping-check')
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eligible).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
  });

  test('11. Refresh Token with Token Rotation', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: customerRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    const newRefreshToken = res.body.data.refreshToken;

    // Attempting to reuse the old refresh token MUST fail
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: customerRefreshToken });

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.code).toBe('REFRESH_TOKEN_REUSED');
  });

  test('12. Customer Address Management', async () => {
    // Add a new office address
    const addRes = await request(app)
      .post('/api/v1/customers/addresses')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        fullName: 'Test Customer Rahim (Office)',
        phone: customerPhone,
        address: 'Level 5, Gulshan 1, Dhaka',
        division: 'Dhaka',
        district: 'Dhaka',
        addressType: 'OFFICE',
        isDefault: false,
      });

    expect(addRes.status).toBe(201);
    expect(addRes.body.data.address_type).toBe('OFFICE');
    const newAddressId = addRes.body.data.id;

    // Set as default address
    const defaultRes = await request(app)
      .patch(`/api/v1/customers/addresses/${newAddressId}/default`)
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(defaultRes.status).toBe(200);
    expect(defaultRes.body.data.success).toBe(true);

    // List addresses
    const listRes = await request(app)
      .get('/api/v1/customers/addresses')
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);
    expect(listRes.body.data[0].id).toBe(newAddressId);
    expect(listRes.body.data[0].is_default).toBe(true);
  });

  test('13. RBAC Protection: Customer cannot access Admin endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/admin/customers')
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('14. Admin can query Audit Logs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
