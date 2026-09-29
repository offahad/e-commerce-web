import { Router } from 'express';
import { BrandsController } from './brands.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requirePermission, requireRole } from '../../common/middleware/rbac-guard.js';

const publicRouter = Router();
const adminRouter = Router();
const controller = new BrandsController();

publicRouter.get('/', controller.list);
publicRouter.get('/:slug', controller.getBySlug);

adminRouter.use(authGuard);
adminRouter.use(requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'));
adminRouter.post('/', requirePermission('PRODUCT_CREATE'), controller.create);
adminRouter.put('/:id', requirePermission('PRODUCT_UPDATE'), controller.update);
adminRouter.delete('/:id', requirePermission('PRODUCT_DELETE'), controller.delete);

export { publicRouter as brandPublicRouter, adminRouter as brandAdminRouter };
