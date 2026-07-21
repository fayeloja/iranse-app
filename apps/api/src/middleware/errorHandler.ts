import { Request, Response, NextFunction } from 'express';
import { logger } from '../infra/logger/logger.js';

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  details?: any;
}

/**
 * Express global error handling middleware.
 * Formats errors and logs them.
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err, '❌ Express Error Handler caught');

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: {
      message,
      status,
      details: err.details || null,
    },
  });
}
export default errorHandler;
