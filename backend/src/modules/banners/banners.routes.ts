import { Router } from 'express';
import { BannersController } from './banners.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requireRole } from '../../common/middleware/rbac-guard.js';

export const bannersPublicRouter = Router();
export const bannersAdminRouter = Router();

const controller = new BannersController();

// Public Banner Route (Customer Storefront)
bannersPublicRouter.get('/', controller.listPublic);

// Admin Banner Routes
bannersAdminRouter.use(authGuard);
bannersAdminRouter.use(requireRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR'));

bannersAdminRouter.get('/', controller.listAdmin);
bannersAdminRouter.get('/:id', controller.getById);
bannersAdminRouter.post('/', controller.create);
bannersAdminRouter.put('/:id', controller.update);
bannersAdminRouter.patch('/:id/status', controller.updateStatus);
bannersAdminRouter.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), controller.delete);
