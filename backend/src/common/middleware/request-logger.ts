import winston from 'winston';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `[${timestamp}] [${level}]: ${message} ${metaString}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

export const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
});

export function sanitizeRequestBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    const sanitized = { ...req.body };
    const sensitiveKeys = ['password', 'confirmPassword', 'token', 'refreshToken', 'accessToken', 'card'];
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '***REDACTED***';
      }
    }
    // store sanitized clone for logging if needed
    (req as any).sanitizedBody = sanitized;
  }
  next();
}
