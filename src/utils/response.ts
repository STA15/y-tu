import { Response, Request } from 'express';
import { ErrorCode, getErrorCodeFromStatus } from '../middleware/errorCodes';
export { ErrorCode, getErrorCodeFromStatus } from '../middleware/errorCodes';
import { getRequestId, getProcessingTime, setRequestStartTime } from './requestId';

/**
 * Standardized API Response Interfaces
 */

export interface SuccessResponseMetadata {
  requestId: string;
  timestamp: string;
  processingTime: number;
}

export interface ErrorResponseMetadata {
  requestId: string;
  timestamp: string;
  processingTime: number;
  path?: string;
  method?: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  metadata: SuccessResponseMetadata;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: ErrorResponseMetadata;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * HTTP Status Code Constants
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  RATE_LIMIT_EXCEEDED = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Create success response metadata
 */
const createSuccessMetadata = (req: Request, res: Response): SuccessResponseMetadata => {
  return {
    requestId: getRequestId(req, res),
    timestamp: new Date().toISOString(),
    processingTime: getProcessingTime(req, res)
  };
};

/**
 * Create error response metadata
 */
const createErrorMetadata = (req: Request, res: Response): ErrorResponseMetadata => {
  return {
    requestId: getRequestId(req, res),
    timestamp: new Date().toISOString(),
    processingTime: getProcessingTime(req, res),
    path: req.path,
    method: req.method
  };
};

/**
 * Send success response (200 OK)
 */
export const sendSuccess = <T>(
  req: Request,
  res: Response,
  data: T
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    metadata: createSuccessMetadata(req, res)
  };

  res.status(HttpStatus.OK).json(response);
};

/**
 * Send created response (201 Created)
 */
export const sendCreated = <T>(
  req: Request,
  res: Response,
  data: T
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    metadata: createSuccessMetadata(req, res)
  };

  res.status(HttpStatus.CREATED).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  req: Request,
  res: Response,
  code: ErrorCode | string,
  message: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: any
): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    },
    metadata: createErrorMetadata(req, res)
  };

  res.status(statusCode).json(response);
};

/**
 * Send bad request error (400)
 */
export const sendBadRequest = (
  req: Request,
  res: Response,
  message: string,
  details?: any
): void => {
  sendError(
    req,
    res,
    ErrorCode.VALIDATION_ERROR,
    message,
    HttpStatus.BAD_REQUEST,
    details
  );
};

/**
 * Send unauthorized error (401)
 */
export const sendUnauthorized = (
  req: Request,
  res: Response,
  message: string = 'Authentication required',
  code: ErrorCode = ErrorCode.UNAUTHORIZED
): void => {
  sendError(req, res, code, message, HttpStatus.UNAUTHORIZED);
};

/**
 * Send forbidden error (403)
 */
export const sendForbidden = (
  req: Request,
  res: Response,
  message: string = 'Access forbidden',
  code: ErrorCode = ErrorCode.FORBIDDEN
): void => {
  sendError(req, res, code, message, HttpStatus.FORBIDDEN);
};

/**
 * Send not found error (404)
 */
export const sendNotFound = (
  req: Request,
  res: Response,
  message: string = 'Resource not found',
  code: ErrorCode = ErrorCode.NOT_FOUND,
  details?: any
): void => {
  sendError(req, res, code, message, HttpStatus.NOT_FOUND, details);
};

/**
 * Send rate limit error (429)
 */
export const sendRateLimitExceeded = (
  req: Request,
  res: Response,
  message: string = 'Rate limit exceeded',
  details?: any
): void => {
  sendError(
    req,
    res,
    ErrorCode.RATE_LIMIT_EXCEEDED,
    message,
    HttpStatus.RATE_LIMIT_EXCEEDED,
    details
  );
};

/**
 * Send internal server error (500)
 */
export const sendInternalServerError = (
  req: Request,
  res: Response,
  message: string = 'Internal server error',
  details?: any
): void => {
  sendError(
    req,
    res,
    ErrorCode.INTERNAL_SERVER_ERROR,
    message,
    HttpStatus.INTERNAL_SERVER_ERROR,
    details
  );
};

/**
 * Send service unavailable error (503)
 */
export const sendServiceUnavailable = (
  req: Request,
  res: Response,
  message: string = 'Service temporarily unavailable',
  code: ErrorCode = ErrorCode.SERVICE_UNAVAILABLE
): void => {
  sendError(req, res, code, message, HttpStatus.SERVICE_UNAVAILABLE);
};

/**
 * Send validation error (400)
 */
export const sendValidationError = (
  req: Request,
  res: Response,
  message: string,
  details?: any
): void => {
  sendError(
    req,
    res,
    ErrorCode.VALIDATION_ERROR,
    message,
    HttpStatus.BAD_REQUEST,
    details
  );
};

/**
 * Send error from AppError
 */
export const sendAppError = (
  req: Request,
  res: Response,
  error: { message: string; statusCode?: number; code?: string },
  details?: any
): void => {
  const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  const code = error.code || getErrorCodeFromStatus(statusCode);
  
  sendError(req, res, code, error.message, statusCode, details);
};

/**
 * Middleware to set request start time
 */
export const requestStartTimeMiddleware = (
  req: Request,
  res: Response,
  next: () => void
): void => {
  setRequestStartTime(req, res);
  getRequestId(req, res); // Initialize request ID
  next();
};