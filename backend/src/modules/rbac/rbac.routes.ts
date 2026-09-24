import { Router } from 'express';
import { RbacController } from './rbac.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requireRole } from '../../common/middleware/rbac-guard.js';

const router = Router();
const controller = new RbacController();

router.use(authGuard);
router.use(requireRole('SUPER_ADMIN', 'ADMIN'));

router.get('/roles', controller.listRoles);
router.get('/permissions', controller.listPermissions);
router.get('/audit-logs', controller.listAuditLogs);

export default router;
