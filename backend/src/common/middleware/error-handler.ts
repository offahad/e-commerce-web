import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '../utils/api-response.js';
import { logger } from './request-logger.js';

export class AppError extends Error {
  statusCode: number;
  code: string;
  errors: string[];

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const errorDetails = err.errors.map((e) => {
      const path = e.path.join('.');
      return `${path ? path + ': ' : ''}${e.message}`;
    });
    return ApiResponse.error(res, 'Validation failed', 'VALIDATION_ERROR', 422, errorDetails);
  }

  // 2. Custom AppError instances
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.code, err.statusCode, err.errors);
  }

  // 3. JWT specific errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid authentication token', 'INVALID_TOKEN', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Authentication token has expired', 'TOKEN_EXPIRED', 401);
  }

  // 4. PostgreSQL / Database unique violation
  if ((err as any).code === '23505' || err.message?.includes('unique constraint') || err.message?.includes('duplicate key')) {
    return ApiResponse.error(res, 'A record with this information already exists', 'DUPLICATE_RESOURCE', 409);
  }

  // 5. Unhandled Server Errors
  logger.error(`[Unhandled Error] ${req.method} ${req.url}: ${err.message}`, {
    stack: err.stack,
  });

  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message,
    'INTERNAL_SERVER_ERROR',
    500
  );
}

export function notFoundHandler(req: Request, res: Response): Response {
  return ApiResponse.error(res, `Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND', 404);
}
