import { Response } from 'express';

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Operation successful',
    statusCode = 200,
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(pagination ? { pagination } : {}),
    });
  }

  static error(
    res: Response,
    message: string,
    code = 'INTERNAL_ERROR',
    statusCode = 500,
    errors: string[] = []
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
      errors,
    });
  }
}
