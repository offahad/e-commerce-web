import { Router } from 'express';
import { couponsController } from './coupons.controller.js';
import { authGuard, optionalAuthGuard } from '../../common/middleware/auth-guard.js';
import { requirePermission } from '../../common/middleware/rbac-guard.js';

export const couponPublicRouter = Router();
couponPublicRouter.post('/validate', optionalAuthGuard, couponsController.validate);

export const couponAdminRouter = Router();
couponAdminRouter.use(authGuard);
couponAdminRouter.use(requirePermission('DISCOUNT_MANAGE'));

couponAdminRouter.get('/', couponsController.list);
couponAdminRouter.get('/:id', couponsController.getById);
couponAdminRouter.post('/', couponsController.create);
couponAdminRouter.put('/:id', couponsController.update);
couponAdminRouter.delete('/:id', couponsController.delete);
