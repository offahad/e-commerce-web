import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { requestLogger, sanitizeRequestBody } from './common/middleware/request-logger.js';
import { errorHandler, notFoundHandler } from './common/middleware/error-handler.js';
import { globalRateLimiter } from './common/middleware/rate-limiter.js';
import { setupSwagger } from './docs/swagger.js';

// Route imports
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import { customerRouter, adminRouter as customerAdminRouter } from './modules/users/users.routes.js';
import rbacRouter from './modules/rbac/rbac.routes.js';

// Phase 3 Catalog & Inventory Route imports
import { categoryPublicRouter, categoryAdminRouter } from './modules/categories/categories.routes.js';
import { brandPublicRouter, brandAdminRouter } from './modules/brands/brands.routes.js';
import { tagPublicRouter, tagAdminRouter } from './modules/tags/tags.routes.js';
import { productPublicRouter, productAdminRouter } from './modules/products/products.routes.js';
import inventoryAdminRouter from './modules/inventory/inventory.routes.js';
import mediaAdminRouter from './modules/media/media.routes.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers & CORS (Allows embedding in Arena iframe preview)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: false, // Allows live preview in Arena iframe
    })
  );

  app.use(
    cors({
      origin: '*', // Allow web and mobile clients
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    })
  );

  // 2. Static File Serving for Media Uploads
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // 3. Request Parsing & Sanitization
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(sanitizeRequestBody);

  // 4. Structured Request Logging
  app.use(requestLogger);

  // 5. Rate Limiting (Disabled in test mode)
  if (process.env.NODE_ENV !== 'test') {
    app.use('/api/', globalRateLimiter);
  }

  // 6. Interactive Swagger / OpenAPI Documentation
  setupSwagger(app);

  // 7. Interactive Liton Brothers Live Preview Dashboard at Root (`/`)
  app.get('/', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Liton Brothers — Live Preview & API Gateway</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #15803d;
      --primary-dark: #166534;
      --primary-light: #dcfce7;
      --accent: #f59e0b;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --badge-red: #ef4444;
      --badge-red-bg: #fee2e2;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.5;
      padding-bottom: 60px;
    }
    header {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }
    .brand-icon {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      color: white;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(21, 128, 61, 0.3);
    }
    .brand-text h1 {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--primary-dark);
      letter-spacing: -0.5px;
    }
    .brand-text p {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .header-links {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1.15rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .btn-primary {
      background-color: var(--primary);
      color: white;
      box-shadow: 0 2px 4px rgba(21, 128, 61, 0.2);
    }
    .btn-primary:hover {
      background-color: var(--primary-dark);
    }
    .btn-outline {
      background-color: transparent;
      border-color: var(--border);
      color: var(--text-main);
    }
    .btn-outline:hover {
      background-color: #f1f5f9;
      border-color: #cbd5e1;
    }
    .container {
      max-width: 1280px;
      margin: 1.5rem auto;
      padding: 0 1.5rem;
    }
    .hero-banner {
      background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%);
      color: white;
      border-radius: 16px;
      padding: 2.25rem 2rem;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(6, 78, 59, 0.2);
    }
    .hero-banner h2 {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 0.5rem;
    }
    .hero-banner p {
      font-size: 1rem;
      opacity: 0.9;
      max-width: 600px;
      margin-bottom: 1.25rem;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #4ade80;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
      animation: pulse 1.6s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
      100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
    }
    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-title span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 0.75rem;
      margin-bottom: 2.5rem;
    }
    .category-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem 0.75rem;
      text-align: center;
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
    }
    .category-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .category-card .icon {
      font-size: 1.75rem;
      margin-bottom: 0.35rem;
    }
    .category-card .name {
      font-size: 0.85rem;
      font-weight: 700;
    }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }
    .product-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
      position: relative;
    }
    .product-card:hover {
      box-shadow: 0 8px 16px -2px rgba(0,0,0,0.06);
      border-color: #cbd5e1;
    }
    .card-badge {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      background: var(--badge-red);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      z-index: 10;
    }
    .card-img-placeholder {
      height: 150px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }
    .card-body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .card-brand {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-name {
      font-size: 1rem;
      font-weight: 700;
      margin: 0.25rem 0 0.5rem;
      color: var(--text-main);
    }
    .variant-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-bottom: 0.85rem;
    }
    .variant-pill {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #f8fafc;
      color: var(--text-muted);
      cursor: pointer;
      font-weight: 600;
    }
    .variant-pill.active {
      background: var(--primary-light);
      border-color: var(--primary);
      color: var(--primary-dark);
    }
    .card-pricing {
      margin-top: auto;
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .sale-price {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary-dark);
    }
    .base-price {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-decoration: line-through;
    }
    .api-explorer {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 14px;
      padding: 1.5rem;
      margin-top: 2rem;
    }
    .api-explorer h3 {
      font-size: 1.15rem;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .endpoint-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .endpoint-tag {
      background: #1e293b;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: monospace;
      color: #38bdf8;
      cursor: pointer;
      border: 1px solid #334155;
      transition: all 0.15s ease;
    }
    .endpoint-tag:hover {
      background: #334155;
      border-color: #38bdf8;
    }
    pre#json-viewer {
      background: #020617;
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.8rem;
      max-height: 280px;
      overflow-y: auto;
      border: 1px solid #1e293b;
      color: #a5f3fc;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-container">
      <a href="/" class="brand-logo">
        <div class="brand-icon">LB</div>
        <div class="brand-text">
          <h1>Liton Brothers</h1>
          <p>Online Grocery & Daily Essentials • BDT (৳)</p>
        </div>
      </a>
      <div class="header-links">
        <a href="/api/v1/health" target="_blank" class="btn btn-outline">⚡ Health API</a>
        <a href="/api/docs" class="btn btn-primary">📖 Interactive Swagger UI</a>
      </div>
    </div>
  </header>

  <div class="container">
    <div class="hero-banner">
      <div class="status-badge">
        <div class="pulse-dot"></div>
        Backend REST API Gateway v1.0.0 Active
      </div>
      <h2>Liton Brothers Multi-Channel E-Commerce</h2>
      <p>Clean, modular, decoupled architecture supporting Customer Web, Admin Dashboard, Mobile Apps (Flutter/React Native), and Delivery Rider applications.</p>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <a href="/api/docs" class="btn" style="background: white; color: #064e3b; font-weight: 700;">Explore Swagger API Docs</a>
        <a href="/api/docs/openapi.json" target="_blank" class="btn" style="background: rgba(255,255,255,0.15); color: white;">Download openapi.json</a>
      </div>
    </div>

    <div class="section-title">
      <span>🛒 Categories Showcase (Hierarchical)</span>
    </div>
    <div class="category-grid">
      <div class="category-card"><div class="icon">🌾</div><div class="name">Grocery</div></div>
      <div class="category-card"><div class="icon">🛢️</div><div class="name">Cooking Oil</div></div>
      <div class="category-card"><div class="icon">🍚</div><div class="name">Miniket Rice</div></div>
      <div class="category-card"><div class="icon">🌶️</div><div class="name">Spices & Masala</div></div>
      <div class="category-card"><div class="icon">🥬</div><div class="name">Fresh Food</div></div>
      <div class="category-card"><div class="icon">🥚</div><div class="name">Eggs & Dairy</div></div>
      <div class="category-card"><div class="icon">🧃</div><div class="name">Beverages</div></div>
      <div class="category-card"><div class="icon">🧴</div><div class="name">Personal Care</div></div>
    </div>

    <div class="section-title">
      <span>🔥 Featured Products with Multi-Quantity Variants (Section 15)</span>
      <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Live Seeded Catalog</span>
    </div>

    <div class="product-grid">
      <!-- Product 1 -->
      <div class="product-card">
        <span class="card-badge">-3% OFF</span>
        <div class="card-img-placeholder">🛢️</div>
        <div class="card-body">
          <span class="card-brand">Teer • Cooking Oil</span>
          <h3 class="card-name">Teer Pure Soybean Oil</h3>
          <div class="variant-pills">
            <span class="variant-pill" onclick="selectVariant(this, 90, 95)">500 ML</span>
            <span class="variant-pill active" onclick="selectVariant(this, 175, 180)">1 Liter</span>
            <span class="variant-pill" onclick="selectVariant(this, 340, 350)">2 Liter</span>
            <span class="variant-pill" onclick="selectVariant(this, 820, 850)">5 Liter</span>
          </div>
          <div class="card-pricing">
            <span class="sale-price">৳175</span>
            <span class="base-price">৳180</span>
          </div>
        </div>
      </div>

      <!-- Product 2 -->
      <div class="product-card">
        <span class="card-badge">-6% OFF</span>
        <div class="card-img-placeholder">🍚</div>
        <div class="card-body">
          <span class="card-brand">Fresh • Rice</span>
          <h3 class="card-name">Miniket Premium Rice</h3>
          <div class="variant-pills">
            <span class="variant-pill active" onclick="selectVariant(this, 75, 80)">1 KG</span>
            <span class="variant-pill" onclick="selectVariant(this, 360, 390)">5 KG</span>
            <span class="variant-pill" onclick="selectVariant(this, 700, 760)">10 KG</span>
            <span class="variant-pill" onclick="selectVariant(this, 1700, 1850)">25 KG</span>
          </div>
          <div class="card-pricing">
            <span class="sale-price">৳75</span>
            <span class="base-price">৳80</span>
          </div>
        </div>
      </div>

      <!-- Product 3 -->
      <div class="product-card">
        <span class="card-badge">-10% OFF</span>
        <div class="card-img-placeholder">🌶️</div>
        <div class="card-body">
          <span class="card-brand">Radhuni • Spices</span>
          <h3 class="card-name">Radhuni Turmeric Powder</h3>
          <div class="variant-pills">
            <span class="variant-pill active" onclick="selectVariant(this, 45, 50)">100 Gram</span>
            <span class="variant-pill" onclick="selectVariant(this, 85, 95)">200 Gram</span>
            <span class="variant-pill" onclick="selectVariant(this, 200, 220)">500 Gram</span>
          </div>
          <div class="card-pricing">
            <span class="sale-price">৳45</span>
            <span class="base-price">৳50</span>
          </div>
        </div>
      </div>

      <!-- Product 4 -->
      <div class="product-card">
        <span class="card-badge">-6% OFF</span>
        <div class="card-img-placeholder">🥚</div>
        <div class="card-body">
          <span class="card-brand">Fresh • Dairy</span>
          <h3 class="card-name">Fresh Farm Eggs (Brown)</h3>
          <div class="variant-pills">
            <span class="variant-pill" onclick="selectVariant(this, 52, 55)">4 Pcs</span>
            <span class="variant-pill active" onclick="selectVariant(this, 150, 160)">12 Pcs</span>
            <span class="variant-pill" onclick="selectVariant(this, 370, 395)">30 Pcs</span>
          </div>
          <div class="card-pricing">
            <span class="sale-price">৳150</span>
            <span class="base-price">৳160</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Live API Explorer / Tester -->
    <div class="api-explorer">
      <h3>🚀 Quick Live API Tester (Click an endpoint to fetch live data)</h3>
      <div class="endpoint-tags">
        <button class="endpoint-tag" onclick="fetchApi('/api/v1/health')">GET /api/v1/health</button>
        <button class="endpoint-tag" onclick="fetchApi('/api/v1/products')">GET /api/v1/products</button>
        <button class="endpoint-tag" onclick="fetchApi('/api/v1/products/teer-pure-soybean-oil')">GET /api/v1/products/teer-pure-soybean-oil</button>
        <button class="endpoint-tag" onclick="fetchApi('/api/v1/categories')">GET /api/v1/categories</button>
        <button class="endpoint-tag" onclick="fetchApi('/api/v1/brands')">GET /api/v1/brands</button>
        <button class="endpoint-tag" onclick="fetchApi('/api/v1/tags')">GET /api/v1/tags</button>
        <button class="endpoint-tag" onclick="fetchApi('/api/v1/products/sections/friday-flash-deal')">GET /api/v1/products/sections/friday-flash-deal</button>
      </div>
      <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.35rem;" id="active-url">URL: /api/v1/health</div>
      <pre id="json-viewer">Loading live health probe...</pre>
    </div>
  </div>

  <script>
    function selectVariant(element, salePrice, basePrice) {
      const parent = element.closest('.card-body');
      parent.querySelectorAll('.variant-pill').forEach(el => el.classList.remove('active'));
      element.classList.add('active');
      parent.querySelector('.sale-price').textContent = '৳' + salePrice;
      parent.querySelector('.base-price').textContent = '৳' + basePrice;
    }

    async function fetchApi(endpoint) {
      document.getElementById('active-url').textContent = 'URL: ' + endpoint;
      document.getElementById('json-viewer').textContent = 'Fetching data...';
      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        document.getElementById('json-viewer').textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        document.getElementById('json-viewer').textContent = 'Error fetching endpoint: ' + err.message;
      }
    }

    // Initial load
    fetchApi('/api/v1/health');
  </script>
</body>
</html>`);
  });

  // 8. Mount REST API Version 1 Routes
  const apiV1 = express.Router();
  apiV1.use(healthRoutes);
  apiV1.use('/auth', authRoutes);
  apiV1.use('/customers', customerRouter);
  apiV1.use('/categories', categoryPublicRouter);
  apiV1.use('/brands', brandPublicRouter);
  apiV1.use('/tags', tagPublicRouter);
  apiV1.use('/products', productPublicRouter);

  // Admin Routes
  apiV1.use('/admin/customers', customerAdminRouter);
  apiV1.use('/admin/categories', categoryAdminRouter);
  apiV1.use('/admin/brands', brandAdminRouter);
  apiV1.use('/admin/tags', tagAdminRouter);
  apiV1.use('/admin/products', productAdminRouter);
  apiV1.use('/admin/inventory', inventoryAdminRouter);
  apiV1.use('/admin/media', mediaAdminRouter);
  apiV1.use('/admin', rbacRouter);

  app.use('/api/v1', apiV1);

  // 9. Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
