import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiResponse } from '../utils/api-response.js';

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    return ApiResponse.error(
      res,
      'Too many requests. Please slow down and try again later.',
      'RATE_LIMIT_EXCEEDED',
      429
    );
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 authentication attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    return ApiResponse.error(
      res,
      'Too many authentication attempts. Please try again after 1 minute.',
      'AUTH_RATE_LIMIT_EXCEEDED',
      429
    );
  },
});
