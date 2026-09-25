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

  // 2. Register customer
  const regRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      phone: '01999888222',
      fullName: 'Order Tester Customer',
      password: 'Customer@123456',
      confirmPassword: 'Customer@123456',
      address: 'House 45, Road 7, Dhanmondi, Dhaka',
    });
  customerUserId = regRes.body.data.user.id;

  // 3. Admin approves customer
  await request(app)
    .patch(`/api/v1/admin/customers/${customerUserId}/status`)
    .set('Authorization', `Bearer ${adminAccessToken}`)
    .send({ status: 'APPROVED', reason: 'Approved for order placement tests' });

  // 4. Customer login
  const custLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      phone: '01999888222',
      password: 'Customer@123456',
    });
  customerAccessToken = custLoginRes.body.data.accessToken;
});

afterAll(async () => {
  const db = getDatabase();
  await db.destroy();
});

describe('Phase 5: Orders, Checkout, Inventory Deduction & Payments Subsystem', () => {
  let sampleVariantId: string;
  let sampleProductId: string;
  let flashVariantId: string;
  let placedOrderId: string;
  let placedOrderTrackingNumber: string;
  let initialStock: number;

  test('0. Setup: Fetch catalog variants and initial inventory levels', async () => {
    const res = await request(app).get('/api/v1/products/teer-pure-soybean-oil');
    expect(res.status).toBe(200);

    sampleProductId = res.body.data.id;
    // TEER-OIL-1L (variant with 100 stock)
    const variant1L = res.body.data.variants.find((v: any) => v.sku === 'TEER-OIL-1L');
    expect(variant1L).toBeDefined();
    sampleVariantId = variant1L.id;
    initialStock = variant1L.stock_quantity;

    // Flash deal variant (5L oil)
    const flashRes = await request(app).get('/api/v1/deals/friday-flash');
    expect(flashRes.status).toBe(200);
    expect(flashRes.body.data.items.length).toBeGreaterThan(0);
    flashVariantId = flashRes.body.data.items[0].variantId;
  });

  test('1. POST /api/v1/orders should atomically create order with COD and deduct stock', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        items: [{ variantId: sampleVariantId, quantity: 2 }],
        paymentMethod: 'COD',
        deliverySlot: 'Evening Delivery (6 PM - 9 PM)',
        customerNotes: 'Please call before arrival.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order.orderNumber).toBeDefined();
    expect(res.body.data.order.trackingNumber).toBeDefined();
    expect(res.body.data.order.status).toBe('PENDING');
    expect(res.body.data.order.paymentStatus).toBe('PENDING');
    expect(res.body.data.order.paymentMethod).toBe('COD');
    expect(res.body.data.payment.instructions).toContain('cash upon doorstep delivery');

    placedOrderId = res.body.data.order.id;
    placedOrderTrackingNumber = res.body.data.order.trackingNumber;

    // Verify Stock Deduction in Database
    const db = getDatabase();
    const updatedVariant = await db('product_variants').where({ id: sampleVariantId }).first();
    expect(Number(updatedVariant.stock_quantity)).toBe(initialStock - 2);

    // Verify Inventory Movement Ledger Record
    const ledger = await db('inventory_transactions')
      .where({ variant_id: sampleVariantId, reference_id: res.body.data.order.orderNumber })
      .first();
    expect(ledger).toBeDefined();
    expect(ledger.transaction_type).toBe('STOCK_OUT');
    expect(Number(ledger.quantity_changed)).toBe(-2);
  });

  test('2. POST /api/v1/orders with Coupon Code should apply verified discount and record usage', async () => {
    // 6 * 175 = 1050 BDT subtotal >= 500 BDT min order for RAMADAN20
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        items: [{ variantId: sampleVariantId, quantity: 6 }],
        couponCode: 'RAMADAN20',
        paymentMethod: 'COD',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const order = res.body.data.order;
    expect(order.subtotal).toBe(1050);
    // 20% of 1050 = 210, capped at max_discount_amount 200
    expect(order.discountAmount).toBe(200);
    expect(order.deliveryFee).toBe(0); // Subtotal >= 1000 threshold
    expect(order.grandTotal).toBe(850); // 1050 - 200 = 850

    // Verify coupon usage in DB
    const db = getDatabase();
    const usage = await db('coupon_usages').where({ order_id: order.id }).first();
    expect(usage).toBeDefined();
    expect(Number(usage.discount_amount)).toBe(200);
  });

  test('3. POST /api/v1/orders with Flash Deal item should apply deal price and decrement flash quota', async () => {
    const db = getDatabase();
    const flashBefore = await db('flash_deal_items').where({ variant_id: flashVariantId }).first();
    const soldBefore = flashBefore.sold_stock;

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        items: [{ variantId: flashVariantId, quantity: 1 }],
        paymentMethod: 'COD',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify flash quota sold_stock incremented
    const flashAfter = await db('flash_deal_items').where({ variant_id: flashVariantId }).first();
    expect(flashAfter.sold_stock).toBe(soldBefore + 1);
  });

  test('4. POST /api/v1/orders should reject orders exceeding warehouse stock (Concurrency Guard)', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        items: [{ variantId: sampleVariantId, quantity: 999999 }],
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient stock');
  });

  test('5. GET /api/v1/orders should return customer order history', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data[0].orderNumber).toBeDefined();
  });

  test('6. GET /api/v1/orders/:id should return complete order detail with line items and status history', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${placedOrderId}`)
      .set('Authorization', `Bearer ${customerAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(placedOrderId);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.statusHistory.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.payments.length).toBe(1);
  });

  test('7. GET /api/v1/orders/track/:trackingNumber should return real-time public tracking progress', async () => {
    const res = await request(app).get(`/api/v1/orders/track/${placedOrderTrackingNumber}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trackingNumber).toBe(placedOrderTrackingNumber);
    expect(res.body.data.timeline.length).toBe(6);
    expect(res.body.data.timeline[0].status).toBe('PENDING');
    expect(res.body.data.timeline[0].completed).toBe(true);
  });

  test('8. POST /api/v1/orders/:id/cancel should cancel order and atomically restock inventory', async () => {
    const db = getDatabase();
    const stockBefore = (await db('product_variants').where({ id: sampleVariantId }).first()).stock_quantity;

    const res = await request(app)
      .post(`/api/v1/orders/${placedOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({ reason: 'Changed mind, ordering different items.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');

    // Verify stock returned (2 units restocked)
    const stockAfter = (await db('product_variants').where({ id: sampleVariantId }).first()).stock_quantity;
    expect(stockAfter).toBe(stockBefore + 2);

    // Verify inventory movement ledger record for restock
    const restockLedger = await db('inventory_transactions')
      .where({ variant_id: sampleVariantId, transaction_type: 'STOCK_IN' })
      .orderBy('created_at', 'desc')
      .first();
    expect(restockLedger.reason).toContain('Cancellation Restock');
  });

  test('9. POST /api/v1/orders/:id/cancel should reject cancelling an already cancelled order', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${placedOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({ reason: 'Try again' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already cancelled');
  });

  test('10. POST /api/v1/orders with bKash payment gateway should initiate online payment URL', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        items: [{ variantId: sampleVariantId, quantity: 1 }],
        paymentMethod: 'BKASH',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.gateway).toBe('BKASH');
    expect(res.body.data.payment.paymentUrl).toContain('bkash.com');
  });

  test('11. Admin: GET /api/v1/admin/orders should list orders with filters and pagination', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  test('12. Admin: PATCH /api/v1/admin/orders/:id/status should update status and mark COD paid upon delivery', async () => {
    // Create new order to test status transitions
    const newOrderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        items: [{ variantId: sampleVariantId, quantity: 1 }],
        paymentMethod: 'COD',
      });

    const testOrderId = newOrderRes.body.data.order.id;

    // Transition to CONFIRMED
    const confirmRes = await request(app)
      .patch(`/api/v1/admin/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ status: 'CONFIRMED', comment: 'Stock verified at warehouse' });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('CONFIRMED');

    // Transition to DELIVERED (auto-marks COD payment as PAID)
    const deliverRes = await request(app)
      .patch(`/api/v1/admin/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ status: 'DELIVERED', comment: 'Customer signed delivery receipt' });

    expect(deliverRes.status).toBe(200);
    expect(deliverRes.body.data.status).toBe('DELIVERED');
    expect(deliverRes.body.data.paymentStatus).toBe('PAID');
  });

  test('13. Admin: GET /api/v1/admin/orders/:id/invoice should return structured printable invoice', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/orders/${placedOrderId}/invoice`)
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.company.name).toContain('Liton Brothers');
    expect(res.body.data.invoice.invoiceNumber).toBeDefined();
    expect(res.body.data.customer.name).toBe('Order Tester Customer');
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.totals.grandTotal).toBeGreaterThan(0);
    expect(res.body.data.totals.currency).toBe('BDT');
  });
});
