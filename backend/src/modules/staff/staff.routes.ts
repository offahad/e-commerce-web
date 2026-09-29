import { Router } from 'express';
import { StaffController } from './staff.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requireRole } from '../../common/middleware/rbac-guard.js';

const router = Router();
const controller = new StaffController();

router.use(authGuard);
// Strict deny-by-default: only SUPER_ADMIN can manage staff
router.use(requireRole('SUPER_ADMIN'));

router.get('/', controller.listStaff);
router.post('/', controller.createStaff);
router.patch('/:id/role', controller.updateRole);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.deleteStaff);

export default router;
