import { Request, Response, NextFunction } from 'express';
import { RbacService } from './rbac.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class RbacController {
  private rbacService: RbacService;

  constructor() {
    this.rbacService = new RbacService();
  }

  listRoles = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await this.rbacService.listRoles();
      return ApiResponse.success(res, roles, 'Roles retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  listPermissions = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const perms = await this.rbacService.listPermissions();
      return ApiResponse.success(res, perms, 'Permissions retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  listAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const { logs, pagination } = await this.rbacService.listAuditLogs(page, limit);
      return ApiResponse.success(res, logs, 'Audit logs retrieved successfully', 200, pagination);
    } catch (err) {
      next(err);
    }
  };
}
