import { Request, Response, NextFunction } from 'express';
import { StaffService } from './staff.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import {
  createStaffSchema,
  updateStaffRoleSchema,
  updateStaffStatusSchema,
} from './staff.dto.js';

export class StaffController {
  private staffService: StaffService;

  constructor() {
    this.staffService = new StaffService();
  }

  listStaff = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const staff = await this.staffService.listStaff();
      return ApiResponse.success(res, staff, 'Staff members retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  createStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createStaffSchema.parse(req.body);
      const staff = await this.staffService.createStaff(validated, req.user!.id, req.ip);
      return ApiResponse.success(res, staff, 'Staff member created successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateStaffRoleSchema.parse(req.body);
      const result = await this.staffService.updateRole(req.params.id as string, validated, req.user!.id, req.ip);
      return ApiResponse.success(res, result, 'Staff role updated successfully');
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateStaffStatusSchema.parse(req.body);
      const result = await this.staffService.updateStatus(req.params.id as string, validated, req.user!.id, req.ip);
      return ApiResponse.success(res, result, 'Staff status updated successfully');
    } catch (err) {
      next(err);
    }
  };

  deleteStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.staffService.deleteStaff(req.params.id as string, req.user!.id, req.ip);
      return ApiResponse.success(res, result, 'Staff member removed successfully');
    } catch (err) {
      next(err);
    }
  };
}
