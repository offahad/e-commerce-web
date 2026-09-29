import { Router } from 'express';
import { settingsController } from './settings.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requirePermission } from '../../common/middleware/rbac-guard.js';

export const settingsPublicRouter = Router();
settingsPublicRouter.get('/', settingsController.getAll);

export const settingsAdminRouter = Router();
settingsAdminRouter.use(authGuard);
settingsAdminRouter.use(requirePermission('SETTINGS_MANAGE'));

settingsAdminRouter.get('/', settingsController.getAll);
settingsAdminRouter.put('/single', settingsController.updateSingle);
settingsAdminRouter.put('/bulk', settingsController.updateMultiple);
