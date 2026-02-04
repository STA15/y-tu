import { Request, Response, NextFunction } from 'express';
import { sendAppError } from '../utils/response';
import { ErrorCode, getErrorCodeFromStatus } from './errorCodes';
import { logger } from '../utils/logger';
import { captureException, setContext } from '../utils/sentry';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: ErrorCode | string;
  details?: any;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || getErrorCodeFromStatus(statusCode);

  // Log error for debugging
  logger.error('Error handler', {
    message: err.message,
    code,
    statusCode,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Send to Sentry for non-operational errors or 5xx errors
  if (!err.isOperational || statusCode >= 500) {
    setContext('request', {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-api-key': req.headers['x-api-key'] ? '***' : undefined,
      },
    });
    
    if (req.user) {
      setContext('user', {
        id: req.user.id,
        tier: req.user.tier,
      });
    }
    
    captureException(err, {
      error: {
        code,
        statusCode,
        details: err.details,
      },
    });
  }

  // Send standardized error response
  sendAppError(req, res, {
    message,
    statusCode,
    code
  }, err.details);
};

export class AppError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;
  code?: ErrorCode | string;
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: ErrorCode | string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code || getErrorCodeFromStatus(statusCode);
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
