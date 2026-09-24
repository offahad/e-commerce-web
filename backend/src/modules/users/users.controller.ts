import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import {
  updateProfileSchema,
  addressSchema,
  adminCustomerStatusSchema,
  adminCustomerQuerySchema,
} from './users.dto.js';

export class UsersController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  // --- Customer Handlers ---

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateProfileSchema.parse(req.body);
      const updated = await this.usersService.updateProfile(req.user!.id, validated);
      return ApiResponse.success(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  };

  listAddresses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addresses = await this.usersService.listAddresses(req.user!.id);
      return ApiResponse.success(res, addresses, 'Addresses retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  addAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = addressSchema.parse(req.body);
      const address = await this.usersService.addAddress(req.user!.id, validated);
      return ApiResponse.success(res, address, 'Address added successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addressId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validated = addressSchema.partial().parse(req.body);
      const address = await this.usersService.updateAddress(req.user!.id, addressId, validated);
      return ApiResponse.success(res, address, 'Address updated successfully');
    } catch (err) {
      next(err);
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addressId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.usersService.deleteAddress(req.user!.id, addressId);
      return ApiResponse.success(res, { deleted: true }, 'Address deleted successfully');
    } catch (err) {
      next(err);
    }
  };

  setDefaultAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addressId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await this.usersService.setDefaultAddress(req.user!.id, addressId);
      return ApiResponse.success(res, result, 'Default address set successfully');
    } catch (err) {
      next(err);
    }
  };

  checkShoppingEligibility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return ApiResponse.success(
        res,
        { eligible: true, status: req.user!.status },
        'Account is approved and eligible for shopping operations'
      );
    } catch (err) {
      next(err);
    }
  };

  // --- Admin Handlers ---

  listCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = adminCustomerQuerySchema.parse(req.query);
      const { customers, pagination } = await this.usersService.listCustomers(query);
      return ApiResponse.success(res, customers, 'Customers retrieved successfully', 200, pagination);
    } catch (err) {
      next(err);
    }
  };

  getCustomer360 = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await this.usersService.getCustomer360(customerId);
      return ApiResponse.success(res, data, 'Customer 360 profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  updateCustomerStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validated = adminCustomerStatusSchema.parse(req.body);
      const userAgent = Array.isArray(req.headers['user-agent'])
        ? req.headers['user-agent'][0]
        : req.headers['user-agent'];
      const updated = await this.usersService.updateCustomerStatus(
        customerId,
        validated,
        req.user!.id,
        req.ip,
        userAgent
      );
      return ApiResponse.success(res, updated, `Customer status updated to ${validated.status}`);
    } catch (err) {
      next(err);
    }
  };
}
