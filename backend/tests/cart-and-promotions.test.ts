import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase, getDatabase } from '../src/database/index.js';

let app: any;
let adminAccessToken: string;
let customerAccessToken: string;
let customerUserId: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDatabase();
  app = createApp();

  // 1. Obtain admin access token
  const adminLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      phone: '01700000000',
      password: 'Admin@123456',
    });
  adminAccessToken = adminLoginRes.body.data.accessToken;

  // 2. Register a customer
  const regRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      phone: '01888999111',
      fullName: 'Cart Tester Customer',
      password: 'Customer@123456',
      confirmPassword: 'Customer@123456',
      address: 'House 12, Road 4, Dhanmondi, Dhaka',
    });
  customerUserId = regRes.body.data.user.id;

  // 3. Admin approves customer
  await request(app)
    .patch(`/api/v1/admin/customers/${customerUserId}/status`)
    .set('Authorization', `Bearer ${adminAccessToken}`)
    .send({ status: 'APPROVED', reason: 'Approved for cart and deals testing' });

  // 4. Customer login
  const custLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      phone: '01888999111',
      password: 'Customer@123456',
    });
  customerAccessToken = custLoginRes.body.data.accessToken;
});

afterAll(async () => {
  const db = getDatabase();
  await db.destroy();
});

describe('Phase 4: Cart, Wishlist, Flash Deals, Coupons & Server-Side Pricing Engine', () => {
  let sampleVariantId: string;
  let sampleProductId: string;
  let cartItemId: string;

  test('0. Setup: Fetch sample variant and product from seeded catalog', async () => {
    const res = await request(app).get('/api/v1/products/teer-pure-soybean-oil');
    expect(res.status).toBe(200);
    expect(res.body.data.variants.length).toBeGreaterThan(0);

    sampleProductId = res.body.data.id;
    sampleVariantId = res.body.data.variants[0].id;
    expect(sampleVariantId).toBeDefined();
  });

  test('1. POST /api/v1/cart/items should add variant to authenticated customer cart', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        variantId: sampleVariantId,
        quantity: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.totalQuantity).toBe(2);
    expect(res.body.data.subtotal).toBeGreaterThan(0);

    cartItemId = res.body.data.items[0].id;
    expect(cartItemId).toBeDefined();
  });

  test('2. GET /api/v1/cart should return live validated cart summary', async () => {
    const res = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].variantId).toBe(sampleVariantId);
    expect(res.body.data.hasOutOfStockItems).toBe(false);
  });

  test('3. PUT /api/v1/cart/items/:id should update item quantity', async () => {
    const res = await request(app)
      .put(`/api/v1/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalQuantity).toBe(3);
  });

  test('4. POST /api/v1/cart/items should reject quantity exceeding available warehouse stock', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        variantId: sampleVariantId,
        quantity: 999999,
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient stock');
  });

  test('5. DELETE /api/v1/cart/items/:id should remove item from cart', async () => {
    const res = await request(app)
      .delete(`/api/v1/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(0);
    expect(res.body.data.subtotal).toBe(0);
  });

  test('6. POST /api/v1/wishlist/:productId should toggle product in wishlist', async () => {
    // 6a. Add to wishlist
    const addRes = await request(app)
      .post(`/api/v1/wishlist/${sampleProductId}`)
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(addRes.status).toBe(200);
    expect(addRes.body.data.wishlisted).toBe(true);

    // 6b. List wishlist
    const listRes = await request(app)
      .get('/api/v1/wishlist')
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].productId).toBe(sampleProductId);

    // 6c. Toggle again to remove
    const removeRes = await request(app)
      .post(`/api/v1/wishlist/${sampleProductId}`)
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.wishlisted).toBe(false);
  });

  test('7. GET /api/v1/deals/friday-flash should return active campaign with countdown timer', async () => {
    const res = await request(app).get('/api/v1/deals/friday-flash');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.campaign.title).toBe('Mega Friday Flash Bazaar');
    expect(res.body.data.campaign.secondsRemaining).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);

    const firstItem = res.body.data.items[0];
    expect(firstItem.dealPrice).toBeLessThan(firstItem.originalPrice);
    expect(firstItem.discountPercentage).toBeGreaterThan(0);
    expect(firstItem.remainingStock).toBeGreaterThan(0);
  });

  test('8. GET /api/v1/deals/deals-of-the-day should return daily discounted items', async () => {
    const res = await request(app).get('/api/v1/deals/deals-of-the-day');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('9. POST /api/v1/coupons/validate should validate percentage coupon RAMADAN20', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .send({
        code: 'RAMADAN20',
        subtotal: 800,
        deliveryFee: 60,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.code).toBe('RAMADAN20');
    // 20% of 800 = 160 BDT
    expect(res.body.data.discountAmount).toBe(160);
  });

  test('10. POST /api/v1/coupons/validate should reject coupon when subtotal is below minimum order', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .send({
        code: 'RAMADAN20',
        subtotal: 300, // min is 500
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('minimum order amount');
  });

  test('11. POST /api/v1/coupons/validate should reject non-existent coupon', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .send({
        code: 'INVALID_CODE_999',
        subtotal: 1000,
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('invalid');
  });

  test('12. POST /api/v1/checkout/preview: Server-Side Price Authority Engine calculation', async () => {
    // User passes variant & quantity (6 * 90 = 540 BDT >= 500 min order) + coupon code
    const res = await request(app)
      .post('/api/v1/checkout/preview')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        items: [{ variantId: sampleVariantId, quantity: 6 }],
        couponCode: 'RAMADAN20',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.subtotal).toBe(540);
    expect(data.discountAmount).toBe(108); // 20% of 540
    expect(data.deliveryFee).toBe(60); // below 1000 BDT threshold
    expect(data.grandTotal).toBe(492); // 540 - 108 + 60
    expect(data.currency).toBe('BDT');

    // Server-side grandTotal check: Subtotal - Discount + DeliveryFee + Tax = GrandTotal
    const expectedGrandTotal = Math.round((data.subtotal - data.discountAmount + data.deliveryFee + data.taxAmount) * 100) / 100;
    expect(data.grandTotal).toBe(expectedGrandTotal);
  });

  test('13. Admin: CRUD operations on coupons', async () => {
    // Create new coupon
    const createRes = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        code: 'SUMMER50',
        title: 'Summer ৳50 Off',
        discountType: 'FIXED_AMOUNT',
        discountValue: 50,
        minOrderAmount: 300,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        usageLimitPerUser: 1,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.code).toBe('SUMMER50');
    const couponId = createRes.body.data.id;

    // List coupons
    const listRes = await request(app)
      .get('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((c: any) => c.code === 'SUMMER50')).toBe(true);

    // Delete coupon
    const delRes = await request(app)
      .delete(`/api/v1/admin/coupons/${couponId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.data.success).toBe(true);
  });

  test('14. Admin: List and Update Flash Deal Status', async () => {
    const listRes = await request(app)
      .get('/api/v1/admin/deals/flash')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);

    const campaignId = listRes.body.data[0].id;
    const detailRes = await request(app)
      .get(`/api/v1/admin/deals/flash/${campaignId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.items.length).toBeGreaterThan(0);
  });

  test('15. Business Settings: Public GET and Admin PUT', async () => {
    // Public GET
    const publicRes = await request(app).get('/api/v1/settings');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.currency).toBe('BDT');
    expect(publicRes.body.data.delivery_fee_standard).toBe('60');

    // Admin single setting update
    const updateRes = await request(app)
      .put('/api/v1/admin/settings/single')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        key: 'free_shipping_threshold',
        value: '1200',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.value).toBe('1200');

    // Revert back
    await request(app)
      .put('/api/v1/admin/settings/single')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        key: 'free_shipping_threshold',
        value: '1000',
      });
  });
});
