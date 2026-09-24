import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { getDatabase } from '../../database/index.js';
import { ApiResponse } from '../utils/api-response.js';

export interface AuthUser {
  id: string;
  phone: string;
  full_name: string;
  role: string;
  status: string;
  email?: string | null;
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}

export async function authGuard(req: Request, res: Response, next: NextFunction): Promise<any> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Authentication token required', 'UNAUTHORIZED', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string; role: string };
    const db = getDatabase();

    const user = await db('users')
      .where({ id: decoded.userId })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return ApiResponse.error(res, 'User account no longer exists', 'USER_NOT_FOUND', 401);
    }

    if (user.status === 'BLOCKED') {
      return ApiResponse.error(res, 'Account is permanently blocked', 'ACCOUNT_BLOCKED', 403);
    }

    if (user.status === 'SUSPENDED') {
      return ApiResponse.error(res, 'Account is temporarily suspended', 'ACCOUNT_SUSPENDED', 403);
    }

    if (user.status === 'REJECTED') {
      return ApiResponse.error(res, 'Account registration was rejected by administrator', 'ACCOUNT_REJECTED', 403);
    }

    // Retrieve user permissions if staff / admin
    let permissions: string[] = [];
    const roleRecord = await db('roles').where({ name: user.role }).first();
    if (roleRecord) {
      const perms = await db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where({ 'role_permissions.role_id': roleRecord.id })
        .select('permissions.code');
      permissions = perms.map((p) => p.code);
    }

    req.user = {
      id: user.id,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      email: user.email,
      permissions,
    };
    req.token = token;

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Authentication token has expired', 'TOKEN_EXPIRED', 401);
    }
    return ApiResponse.error(res, 'Invalid authentication token', 'INVALID_TOKEN', 401);
  }
}
