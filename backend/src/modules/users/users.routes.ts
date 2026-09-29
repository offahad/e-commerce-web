import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requireApprovedCustomer } from '../../common/middleware/customer-approval-guard.js';
import { requirePermission, requireRole } from '../../common/middleware/rbac-guard.js';

const customerRouter = Router();
const adminRouter = Router();
const controller = new UsersController();

// Customer Endpoints
customerRouter.use(authGuard);
customerRouter.put('/profile', controller.updateProfile);
customerRouter.get('/addresses', controller.listAddresses);
customerRouter.post('/addresses', controller.addAddress);
customerRouter.put('/addresses/:id', controller.updateAddress);
customerRouter.delete('/addresses/:id', controller.deleteAddress);
customerRouter.patch('/addresses/:id/default', controller.setDefaultAddress);

// Protected shopping verification route (ensures user is APPROVED)
customerRouter.get('/shopping-check', requireApprovedCustomer, controller.checkShoppingEligibility);

// Admin Customer Management Endpoints
adminRouter.use(authGuard);
adminRouter.use(requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

adminRouter.get('/', requirePermission('USER_VIEW'), controller.listCustomers);
adminRouter.get('/:id', requirePermission('USER_VIEW'), controller.getCustomer360);
adminRouter.patch('/:id/status', requirePermission('USER_APPROVE'), controller.updateCustomerStatus);

export { customerRouter, adminRouter };
