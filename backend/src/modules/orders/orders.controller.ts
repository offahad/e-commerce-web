import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service.js';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  UpdateOrderPaymentStatusSchema,
  CancelOrderSchema,
} from './orders.dto.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class OrdersController {
  // Customer Endpoints
  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = CreateOrderSchema.parse(req.body);
      const userId = req.user!.id;
      const order = await ordersService.createOrder(userId, validated);
      ApiResponse.success(res, order, 'Order placed successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  listCustomerOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await ordersService.listCustomerOrders(userId, page, limit);
      ApiResponse.paginated(res, result.orders, result.pagination, 'Order history retrieved');
    } catch (err) {
      next(err);
    }
  };

  getCustomerOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const orderId = req.params.id as string;
      const order = await ordersService.getOrderById(orderId, userId);
      ApiResponse.success(res, order, 'Order details retrieved');
    } catch (err) {
      next(err);
    }
  };

  cancelCustomerOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = CancelOrderSchema.parse(req.body);
      const userId = req.user!.id;
      const orderId = req.params.id as string;
      const result = await ordersService.cancelOrder(orderId, userId, validated.reason, false);
      ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  };

  trackOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const trackingNumber = req.params.trackingNumber as string;
      const tracking = await ordersService.trackOrderByNumber(trackingNumber);
      ApiResponse.success(res, tracking, 'Order tracking progress retrieved');
    } catch (err) {
      next(err);
    }
  };

  // Admin Endpoints
  listAdminOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, status, paymentStatus, page, limit } = req.query;
      const result = await ordersService.listAdminOrders({
        search: search as string,
        status: status as string,
        paymentStatus: paymentStatus as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      ApiResponse.paginated(res, result.orders, result.pagination, 'Admin orders retrieved');
    } catch (err) {
      next(err);
    }
  };

  getAdminOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderId = req.params.id as string;
      const order = await ordersService.getOrderById(orderId);
      ApiResponse.success(res, order, 'Order details retrieved');
    } catch (err) {
      next(err);
    }
  };

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = UpdateOrderStatusSchema.parse(req.body);
      const orderId = req.params.id as string;
      const adminId = req.user!.id;
      const order = await ordersService.updateOrderStatus(orderId, validated.status, adminId, validated.comment);
      ApiResponse.success(res, order, `Order status updated to ${validated.status}`);
    } catch (err) {
      next(err);
    }
  };

  updatePaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = UpdateOrderPaymentStatusSchema.parse(req.body);
      const orderId = req.params.id as string;
      const order = await ordersService.updatePaymentStatus(
        orderId,
        validated.paymentStatus,
        validated.transactionId,
        validated.comment
      );
      ApiResponse.success(res, order, `Payment status updated to ${validated.paymentStatus}`);
    } catch (err) {
      next(err);
    }
  };

  getOrderInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderId = req.params.id as string;
      const invoice = await ordersService.getOrderInvoice(orderId);
      ApiResponse.success(res, invoice, 'Invoice data generated successfully');
    } catch (err) {
      next(err);
    }
  };
}

export const ordersController = new OrdersController();
