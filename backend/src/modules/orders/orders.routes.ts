import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { customerApprovalGuard } from '../../common/middleware/customer-approval-guard.js';
import { requirePermission } from '../../common/middleware/rbac-guard.js';

export const ordersCustomerRouter = Router();

// Public order tracking
ordersCustomerRouter.get('/track/:trackingNumber', ordersController.trackOrder);

// Authenticated & Approved Customer order operations
ordersCustomerRouter.use(authGuard);
ordersCustomerRouter.use(customerApprovalGuard);

ordersCustomerRouter.post('/', ordersController.createOrder);
ordersCustomerRouter.get('/', ordersController.listCustomerOrders);
ordersCustomerRouter.get('/:id', ordersController.getCustomerOrderById);
ordersCustomerRouter.post('/:id/cancel', ordersController.cancelCustomerOrder);

// Admin Orders Router
export const ordersAdminRouter = Router();
ordersAdminRouter.use(authGuard);
ordersAdminRouter.use(requirePermission('ORDER_VIEW'));

ordersAdminRouter.get('/', ordersController.listAdminOrders);
ordersAdminRouter.get('/:id', ordersController.getAdminOrderById);
ordersAdminRouter.get('/:id/invoice', ordersController.getOrderInvoice);
ordersAdminRouter.patch('/:id/status', requirePermission('ORDER_UPDATE'), ordersController.updateOrderStatus);
ordersAdminRouter.patch('/:id/payment', requirePermission('ORDER_UPDATE'), ordersController.updatePaymentStatus);
