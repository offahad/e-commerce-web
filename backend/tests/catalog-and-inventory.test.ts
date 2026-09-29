import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase, getDatabase } from '../src/database/index.js';

let app: any;
let adminAccessToken: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDatabase();
  app = createApp();

  // Obtain admin access token
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      phone: '01700000000',
      password: 'Admin@123456',
    });
  adminAccessToken = loginRes.body.data.accessToken;
});

afterAll(async () => {
  const db = getDatabase();
  await db.destroy();
});

describe('Phase 3: Catalog, Categories, Brands, Products, Variants & Inventory', () => {
  let createdProductId: string;
  let createdVariantId: string;

  test('1. GET /api/v1/categories should return hierarchical category tree', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const grocery = res.body.data.find((c: any) => c.slug === 'grocery');
    expect(grocery).toBeDefined();
    expect(Array.isArray(grocery.children)).toBe(true);
    expect(grocery.children.length).toBeGreaterThanOrEqual(3);

    const cookingOil = grocery.children.find((ch: any) => ch.slug === 'cooking-oil');
    expect(cookingOil).toBeDefined();
  });

  test('2. GET /api/v1/categories/:slug should return category details and product count', async () => {
    const res = await request(app).get('/api/v1/categories/cooking-oil');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('cooking-oil');
    expect(res.body.data.productCount).toBeGreaterThanOrEqual(1);
  });

  test('3. GET /api/v1/brands should return active brands', async () => {
    const res = await request(app).get('/api/v1/brands');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const teer = res.body.data.find((b: any) => b.slug === 'teer');
    expect(teer).toBeDefined();
  });

  test('4. GET /api/v1/tags should return product tags', async () => {
    const res = await request(app).get('/api/v1/tags');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const popular = res.body.data.find((t: any) => t.slug === 'popular');
    expect(popular).toBeDefined();
  });

  test('5. GET /api/v1/products - Search and Faceted Filtering', async () => {
    // 5a. Keyword Search
    const searchRes = await request(app).get('/api/v1/products?q=Soybean');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(searchRes.body.data[0].name).toContain('Soybean');

    // 5b. Brand Filter
    const brandRes = await request(app).get('/api/v1/products?brand=teer');
    expect(brandRes.status).toBe(200);
    expect(brandRes.body.data.every((p: any) => p.brand_slug === 'teer')).toBe(true);

    // 5c. Category Filter
    const catRes = await request(app).get('/api/v1/products?category=cooking-oil');
    expect(catRes.status).toBe(200);
    expect(catRes.body.data.length).toBeGreaterThanOrEqual(2);

    // 5d. Sorting Price Low to High
    const sortRes = await request(app).get('/api/v1/products?sortBy=price_asc');
    expect(sortRes.status).toBe(200);
    const prices = sortRes.body.data.map((p: any) => Number(p.sale_price));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('6. GET /api/v1/products/:slug - Multi-Quantity Variants details', async () => {
    const res = await request(app).get('/api/v1/products/teer-pure-soybean-oil');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Teer Pure Soybean Oil');
    expect(Array.isArray(res.body.data.variants)).toBe(true);

    // Must have 4 purchasable variants (500 ML, 1 Liter, 2 Liter, 5 Liter)
    expect(res.body.data.variants.length).toBe(4);
    const oneLiter = res.body.data.variants.find((v: any) => v.display_name === '1 Liter');
    expect(oneLiter).toBeDefined();
    expect(Number(oneLiter.sale_price)).toBe(175);
    expect(oneLiter.stock_quantity).toBeGreaterThan(0);
  });

  test('7. GET /api/v1/products/suggestions - Autocomplete Search Suggestions', async () => {
    const res = await request(app).get('/api/v1/products/suggestions?q=Oil');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.categories.length).toBeGreaterThanOrEqual(1);
  });

  test('8. GET /api/v1/products/sections/:sectionKey - Homepage Dynamic Sections', async () => {
    const res = await request(app).get('/api/v1/products/sections/friday-flash-deal');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('9. Admin: Create Product with Multi-Quantity Variants and Stock', async () => {
    const cat = await request(app).get('/api/v1/categories/rice');
    const brand = await request(app).get('/api/v1/brands/fresh');

    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        name: 'Fresh Chinigura Aromatic Rice',
        sku: 'LB-PROD-CHINI-001',
        description: 'Finest aromatic Chinigura rice for delicious Biryani and Polao.',
        shortDescription: 'Pure fragrant Chinigura rice.',
        brandId: brand.body.data.id,
        primaryCategoryId: cat.body.data.id,
        basePrice: 160,
        salePrice: 150,
        discountPercentage: 6.25,
        unit: 'KG',
        tags: ['Grocery', 'Rice', 'Popular', 'Friday Flash Deal'],
        variants: [
          {
            sku: 'CHINI-RICE-1KG',
            displayName: '1 KG',
            unit: 'KG',
            quantity: 1,
            price: 160,
            salePrice: 150,
            stockQuantity: 40,
          },
          {
            sku: 'CHINI-RICE-5KG',
            displayName: '5 KG (Pack)',
            unit: 'KG',
            quantity: 5,
            price: 780,
            salePrice: 730,
            stockQuantity: 20,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Fresh Chinigura Aromatic Rice');
    expect(res.body.data.stock_quantity).toBe(60); // 40 + 20
    expect(res.body.data.variants.length).toBe(2);

    createdProductId = res.body.data.id;
    createdVariantId = res.body.data.variants[0].id;
  });

  test('10. Admin: Price Update with Automated Price History Logging', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        salePrice: 145,
        basePrice: 160,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sale_price).toBe(145);

    // Verify Price History was recorded
    const detailRes = await request(app).get(`/api/v1/products/${res.body.data.slug}`);
    expect(detailRes.body.data.priceHistory.length).toBeGreaterThanOrEqual(1);
  });

  test('11. Admin: Inventory Stock In and Movement Ledger', async () => {
    // Add 25 units to the 1 KG variant
    const adjustRes = await request(app)
      .post('/api/v1/admin/inventory/adjust')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        productId: createdProductId,
        variantId: createdVariantId,
        transactionType: 'STOCK_IN',
        quantity: 25,
        reason: 'Restocking fresh shipment from mill',
        referenceId: 'PO-CHINI-2026',
      });

    expect(adjustRes.status).toBe(201);
    expect(adjustRes.body.success).toBe(true);
    expect(adjustRes.body.data.previous_stock).toBe(40);
    expect(adjustRes.body.data.new_stock).toBe(65);

    // Query inventory transaction history
    const txRes = await request(app)
      .get(`/api/v1/admin/inventory/transactions?productId=${createdProductId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(txRes.status).toBe(200);
    expect(txRes.body.data.length).toBeGreaterThanOrEqual(1);
    const foundTx = txRes.body.data.find((tx: any) => tx.reason === 'Restocking fresh shipment from mill');
    expect(foundTx).toBeDefined();
    expect(foundTx.new_stock).toBe(65);
  });

  test('12. Admin: Stock Alerts (Low stock and Out of stock)', async () => {
    const alertsRes = await request(app)
      .get('/api/v1/admin/inventory/alerts')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(alertsRes.status).toBe(200);
    expect(alertsRes.body.success).toBe(true);
    expect(typeof alertsRes.body.data.outOfStockCount).toBe('number');
    expect(typeof alertsRes.body.data.lowStockCount).toBe('number');
  });

  test('13. Admin: Image Upload with Sharp WebP Processing', async () => {
    const sharp = require('sharp');
    // Generate a 100x100 sample test image buffer
    const testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 16, g: 185, b: 129, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const uploadRes = await request(app)
      .post('/api/v1/admin/media/upload')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .attach('image', testImageBuffer, 'sample-product.png');

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.format).toBe('webp');
    expect(uploadRes.body.data.url).toMatch(/^\/uploads\/products\/.+\.webp$/);
    expect(uploadRes.body.data.thumbnailUrl).toMatch(/^\/uploads\/products\/.+-thumb\.webp$/);
  });
});
