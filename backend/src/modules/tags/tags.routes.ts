import { Router } from 'express';
import { TagsController } from './tags.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requirePermission, requireRole } from '../../common/middleware/rbac-guard.js';

const publicRouter = Router();
const adminRouter = Router();
const controller = new TagsController();

publicRouter.get('/', controller.list);

adminRouter.use(authGuard);
adminRouter.use(requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'));
adminRouter.post('/', requirePermission('PRODUCT_CREATE'), controller.create);

export { publicRouter as tagPublicRouter, adminRouter as tagAdminRouter };
