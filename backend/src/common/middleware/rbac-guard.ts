import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/api-response.js';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    // Super Admin has unrestricted access to all operations
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
        'FORBIDDEN',
        403
      );
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    // Super Admin bypasses permission checks
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      return ApiResponse.error(
        res,
        `Access denied. Required permissions: [${requiredPermissions.join(', ')}]`,
        'INSUFFICIENT_PERMISSIONS',
        403
      );
    }

    next();
  };
}
