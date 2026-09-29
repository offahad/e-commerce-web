import { Router } from 'express';
import { ProductsController } from './products.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requirePermission, requireRole } from '../../common/middleware/rbac-guard.js';

const publicRouter = Router();
const adminRouter = Router();
const controller = new ProductsController();

// Public routes
publicRouter.get('/', controller.list);
publicRouter.get('/suggestions', controller.getSuggestions);
publicRouter.get('/sections/:sectionKey', controller.getSectionProducts);
publicRouter.get('/:slug', controller.getBySlug);

// Admin routes
adminRouter.use(authGuard);
adminRouter.use(requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'));
adminRouter.post('/', requirePermission('PRODUCT_CREATE'), controller.create);
adminRouter.put('/:id', requirePermission('PRODUCT_UPDATE'), controller.update);
adminRouter.delete('/:id', requirePermission('PRODUCT_DELETE'), controller.delete);

export { publicRouter as productPublicRouter, adminRouter as productAdminRouter };
