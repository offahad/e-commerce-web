import { Router } from 'express';
import { dealsController } from './deals.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requirePermission } from '../../common/middleware/rbac-guard.js';

export const dealsPublicRouter = Router();
dealsPublicRouter.get('/friday-flash', dealsController.getFridayFlashDeal);
dealsPublicRouter.get('/deals-of-the-day', dealsController.getDealsOfTheDay);

export const dealsAdminRouter = Router();
dealsAdminRouter.use(authGuard);
dealsAdminRouter.use(requirePermission('DISCOUNT_MANAGE'));

dealsAdminRouter.post('/flash', dealsController.createFlashDeal);
dealsAdminRouter.get('/flash', dealsController.listFlashDeals);
dealsAdminRouter.get('/flash/:id', dealsController.getFlashDealById);
dealsAdminRouter.patch('/flash/:id/status', dealsController.updateFlashDealStatus);
