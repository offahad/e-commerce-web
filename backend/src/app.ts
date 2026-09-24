import express, { Express } from 'express';
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

  // 1. Security Headers & CORS
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI to execute inline scripts
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows uploaded images to be displayed in client browsers
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

  // 7. Mount REST API Version 1 Routes
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

  // Root redirect to docs
  app.get('/', (_req, res) => {
    res.redirect('/api/docs');
  });

  // 8. Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
