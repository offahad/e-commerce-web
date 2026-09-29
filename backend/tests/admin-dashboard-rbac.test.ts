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

describe('Phase 6: Admin Dashboard, RBAC Enforcements, Staff & Customer Approvals', () => {
  let superAdminToken: string;
  let moderatorToken: string;
  let customerToken: string;
  let pendingCustomerId: string;
  let invitedStaffId: string;
  let createdBannerId: string;
  let sampleProductId: string;

  const demoCustomerPhone = '01799887766';
  let demoResetCode: string;

  // 1. Password Reset Flow
  describe('Customer Password Reset Flow', () => {
    test('1a. Register a test customer for password reset', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Password Reset Demo User',
          phone: demoCustomerPhone,
          password: 'OldPassword@123',
          confirmPassword: 'OldPassword@123',
          address: 'Mirpur 10, Dhaka',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      pendingCustomerId = res.body.data.user.id;
    });

    test('1b. POST /api/v1/auth/forgot-password generates reset token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ phone: demoCustomerPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resetCodePreview).toBeDefined();
      demoResetCode = res.body.data.resetCodePreview;
    });

    test('1c. POST /api/v1/auth/reset-password fails on mismatched passwords', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          phone: demoCustomerPhone,
          resetCode: demoResetCode,
          newPassword: 'NewPassword@456',
          confirmPassword: 'DifferentPassword@789',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    test('1d. POST /api/v1/auth/reset-password succeeds with valid code and matching passwords', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          phone: demoCustomerPhone,
          resetCode: demoResetCode,
          newPassword: 'NewPassword@456',
          confirmPassword: 'NewPassword@456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('1e. Customer can log in with new password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: demoCustomerPhone,
          password: 'NewPassword@456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      customerToken = res.body.data.accessToken;
    });
  });

  // 2. Staff Management & Deny-by-default RBAC
  describe('Staff Invitation & Super Admin Exclusive RBAC', () => {
    test('2a. Super Admin login with default credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: '01700000000',
          password: 'Admin@123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('SUPER_ADMIN');
      superAdminToken = res.body.data.accessToken;
    });

    test('2b. Super Admin invites a new staff member (MODERATOR)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          fullName: 'Tariq Moderator',
          phone: '01755554444',
          email: 'tariq.mod@litonbrothers.com',
          role: 'MODERATOR',
          password: 'StaffSecret@123',
          notes: 'Assigned to evening catalog & banner review',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('MODERATOR');
      invitedStaffId = res.body.data.id;
    });

    test('2c. Super Admin lists all staff members', async () => {
      const res = await request(app)
        .get('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find((s: any) => s.id === invitedStaffId);
      expect(found).toBeDefined();
      expect(found.role).toBe('MODERATOR');
    });

    test('2d. Super Admin updates staff role with required reason', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/staff/${invitedStaffId}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          role: 'MANAGER',
          reason: 'Promoted to Store Manager for exceptional order processing',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('MANAGER');
    });

    test('2e. Super Admin updates staff status (SUSPENDED and back to APPROVED)', async () => {
      const suspendRes = await request(app)
        .patch(`/api/v1/admin/staff/${invitedStaffId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'SUSPENDED',
          reason: 'Temporary leave of absence',
        });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.status).toBe('SUSPENDED');

      const activateRes = await request(app)
        .patch(`/api/v1/admin/staff/${invitedStaffId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'APPROVED',
          reason: 'Returned from leave',
        });

      expect(activateRes.status).toBe(200);
      expect(activateRes.body.data.status).toBe('APPROVED');
    });

    test('2f. Store Moderator logs in with default seeded credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: '01711111111',
          password: 'Moderator@123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('MODERATOR');
      moderatorToken = res.body.data.accessToken;
    });

    test('2g. DENY-BY-DEFAULT: Moderator CANNOT invite staff (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          fullName: 'Unauthorized Member',
          phone: '01733332222',
          role: 'STAFF',
          password: 'Password@123',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    test('2h. DENY-BY-DEFAULT: Moderator CANNOT view staff list (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    test('2i. DENY-BY-DEFAULT: Moderator CANNOT view sensitive audit logs (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    test('2j. Super Admin CAN view sensitive audit logs with sanitized details', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      // Ensure passwords never appear in values
      const jsonStr = JSON.stringify(res.body.data);
      expect(jsonStr).not.toContain('password_hash');
    });
  });

  // 3. Customer Approvals Queue
  describe('Customer Approvals Queue (Super Admin Exclusive)', () => {
    test('3a. DENY-BY-DEFAULT: Moderator CANNOT approve or reject customers (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/customers/${pendingCustomerId}/status`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          status: 'APPROVED',
          reason: 'Moderator trying to approve',
        });

      expect(res.status).toBe(403);
    });

    test('3b. Super Admin views Customer 360 with account history', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/customers/${pendingCustomerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.customer.id).toBe(pendingCustomerId);
      expect(res.body.data.statusHistory).toBeDefined();
      expect(Array.isArray(res.body.data.statusHistory)).toBe(true);
    });

    test('3c. Super Admin approves customer account with recorded reason and audit log', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/customers/${pendingCustomerId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'APPROVED',
          reason: 'Customer verified via phone call and NID address verification.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.approved_at).toBeDefined();
    });

    test('3d. Approved customer can now access shopping-check', async () => {
      const res = await request(app)
        .get('/api/v1/customers/shopping-check')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.eligible).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  // 4. Inventory Management & Alert Acknowledgement
  describe('Inventory Management & Stock Alert Acknowledgement', () => {
    test('4a. Fetch product ID for stock test', async () => {
      const res = await request(app).get('/api/v1/products?limit=1');
      expect(res.status).toBe(200);
      sampleProductId = res.body.data[0].id;
    });

    test('4b. GET /api/v1/admin/inventory/alerts returns low & out of stock alerts with acknowledgement data', async () => {
      const res = await request(app)
        .get('/api/v1/admin/inventory/alerts')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.outOfStockProducts).toBeDefined();
      expect(res.body.data.lowStockProducts).toBeDefined();
    });

    test('4c. POST /api/v1/admin/inventory/alerts/acknowledge records alert acknowledgement', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/alerts/acknowledge')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          productId: sampleProductId,
          alertType: 'LOW_STOCK',
          note: 'Replenishment order PO-9831 submitted to supplier.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    test('4d. Stock adjustment FAILS without mandatory reason (Validation Guard)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          productId: sampleProductId,
          transactionType: 'STOCK_IN',
          quantity: 25,
          reason: '', // Empty reason
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    test('4e. Stock adjustment SUCCEEDS with mandatory audit reason and records immutable ledger', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          productId: sampleProductId,
          transactionType: 'STOCK_IN',
          quantity: 25,
          reason: 'Received shipment from Teer Wholesale Hub batch #TH-902',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.quantity_changed).toBe(25);
      expect(res.body.data.reason).toContain('Teer Wholesale Hub');
    });
  });

  // 5. Persistent Hero Banners Workflow
  describe('Hero Carousel Banners Persistent Knex/API Workflow', () => {
    test('5a. Public GET /api/v1/hero-banners returns active published banners', async () => {
      const res = await request(app).get('/api/v1/hero-banners');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    test('5b. Admin POST /api/v1/admin/hero-banners creates new banner with scheduling and alt text', async () => {
      const res = await request(app)
        .post('/api/v1/admin/hero-banners')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Ramadan Special Grocery Package',
          subtitle: 'Pure mustard oil, premium dates, aromatic rice and chickpeas at wholesale rates.',
          tag: 'Ramadan Bazaar',
          buttonText: 'Order Package',
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
          imageAlt: 'Ramadan grocery package assortment with oils and rice',
          destinationCategory: 'grocery',
          displayOrder: 3,
          startDate: new Date(Date.now() - 3600000).toISOString(),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          status: 'PUBLISHED',
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Ramadan Special Grocery Package');
      expect(res.body.data.image_alt).toBe('Ramadan grocery package assortment with oils and rice');
      createdBannerId = res.body.data.id;
    });

    test('5c. Admin PUT /api/v1/admin/hero-banners/:id updates banner details', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/hero-banners/${createdBannerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Ramadan Special Mega Package — 10% Extra Cashback',
          displayOrder: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain('10% Extra Cashback');
      expect(res.body.data.display_order).toBe(1);
    });

    test('5d. Admin PATCH /api/v1/admin/hero-banners/:id/status toggles status to DRAFT', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/hero-banners/${createdBannerId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'DRAFT',
          isActive: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DRAFT');
    });

    test('5e. Admin DELETE /api/v1/admin/hero-banners/:id removes banner', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/hero-banners/${createdBannerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });
  });

  // 6. Admin Account Protection with MFA
  describe('Admin Multi-Factor Authentication (MFA)', () => {
    test('6a. Super Admin sets up MFA', async () => {
      const res = await request(app)
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.secret).toBeDefined();
      expect(res.body.data.setupCode).toBe('654321');
    });

    test('6b. Super Admin enables MFA with valid code', async () => {
      const res = await request(app)
        .post('/api/v1/auth/mfa/enable')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ code: '654321' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('6c. Login with MFA enabled triggers 2FA code requirement', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: '01700000000',
          password: 'Admin@123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.mfaRequired).toBe(true);
      expect(res.body.data.tempToken).toBeDefined();

      // Complete login with MFA verification code
      const mfaLoginRes = await request(app)
        .post('/api/v1/auth/mfa/verify-login')
        .send({
          tempToken: res.body.data.tempToken,
          code: '654321',
        });

      expect(mfaLoginRes.status).toBe(200);
      expect(mfaLoginRes.body.data.accessToken).toBeDefined();
      expect(mfaLoginRes.body.data.user.role).toBe('SUPER_ADMIN');
    });
  });
});
