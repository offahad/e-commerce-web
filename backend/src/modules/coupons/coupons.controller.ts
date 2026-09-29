import { Request, Response, NextFunction } from 'express';
import { couponsService } from './coupons.service.js';
import { CreateCouponSchema, UpdateCouponSchema, ValidateCouponSchema } from './coupons.dto.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class CouponsController {
  // Public / Customer endpoint to validate coupon against cart
  validate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = ValidateCouponSchema.parse(req.body);
      const userId = req.user?.id;
      const result = await couponsService.validateCoupon(
        validated.code,
        validated.subtotal,
        userId,
        validated.deliveryFee
      );

      ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  };

  // Admin endpoints
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, isActive, page, limit } = req.query;
      const result = await couponsService.listCoupons({
        search: search as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      ApiResponse.paginated(res, result.coupons, result.pagination, 'Coupons listed successfully');
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coupon = await couponsService.getCouponById(req.params.id as string);
      ApiResponse.success(res, coupon, 'Coupon details retrieved');
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = CreateCouponSchema.parse(req.body);
      const coupon = await couponsService.createCoupon(validated);
      ApiResponse.success(res, coupon, 'Coupon created successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = UpdateCouponSchema.parse(req.body);
      const coupon = await couponsService.updateCoupon(req.params.id as string, validated);
      ApiResponse.success(res, coupon, 'Coupon updated successfully');
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await couponsService.deleteCoupon(req.params.id as string);
      ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  };
}

export const couponsController = new CouponsController();
