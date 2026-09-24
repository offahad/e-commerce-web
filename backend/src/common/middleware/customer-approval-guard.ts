import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/api-response.js';

export function requireApprovedCustomer(req: Request, res: Response, next: NextFunction): any {
  if (!req.user) {
    return ApiResponse.error(res, 'Authentication required', 'UNAUTHORIZED', 401);
  }

  // Admins & staff can preview shopping operations
  if (['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'].includes(req.user.role)) {
    return next();
  }

  if (req.user.status === 'PENDING_APPROVAL') {
    return ApiResponse.error(
      res,
      'Your account is currently awaiting administrator approval. You will receive access to shop once approved.',
      'ACCOUNT_PENDING_APPROVAL',
      403
    );
  }

  if (req.user.status === 'REJECTED') {
    return ApiResponse.error(
      res,
      'Your account registration has been rejected by the administrator.',
      'ACCOUNT_REJECTED',
      403
    );
  }

  if (req.user.status === 'BLOCKED') {
    return ApiResponse.error(
      res,
      'Your account has been blocked from performing shopping operations.',
      'ACCOUNT_BLOCKED',
      403
    );
  }

  if (req.user.status === 'SUSPENDED') {
    return ApiResponse.error(
      res,
      'Your account is currently suspended.',
      'ACCOUNT_SUSPENDED',
      403
    );
  }

  if (req.user.status !== 'APPROVED') {
    return ApiResponse.error(
      res,
      'Your account status does not permit this operation.',
      'ACCOUNT_NOT_APPROVED',
      403
    );
  }

  next();
}
