import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requirePermission, requireRole } from '../../common/middleware/rbac-guard.js';

const router = Router();
const controller = new InventoryController();

router.use(authGuard);
router.use(requireRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'MANAGER'));

router.post('/adjust', requirePermission('INVENTORY_MANAGE'), controller.adjustStock);
router.get('/transactions', requirePermission('INVENTORY_MANAGE'), controller.listTransactions);
router.get('/alerts', requirePermission('INVENTORY_MANAGE'), controller.getAlerts);
router.post('/alerts/acknowledge', requirePermission('INVENTORY_MANAGE'), controller.acknowledgeAlert);

export default router;
