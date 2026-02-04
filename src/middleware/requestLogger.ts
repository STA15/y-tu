import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';
import { performanceMonitor } from '../services/performanceMonitor.service';

/**
 * Fields that should be redacted from logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'x-api-key',
  'authorization',
  'secret',
  'privateKey',
  'private_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'jwt',
  'session',
  'cookie',
  'creditCard',
  'credit_card',
  'ssn',
  'socialSecurityNumber',
];

/**
 * Redact sensitive data from object
 */
const redactSensitiveData = (obj: any, depth: number = 0): any => {
  if (depth > 10) {
    return '[Max Depth Reached]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Check if string contains sensitive patterns
    if (obj.length > 1000) {
      return '[Large String]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const redacted: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = redactSensitiveData(value, depth + 1);
      } else if (typeof value === 'string' && value.length > 500) {
        redacted[key] = value.substring(0, 100) + '...[truncated]';
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  return obj;
};

/**
 * Get client IP address
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
  }
  return req.socket.remoteAddress || req.ip || 'unknown';
};

/**
 * Request logging middleware with sensitive data redaction and performance monitoring
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const clientIp = getClientIp(req);
  const method = req.method;
  const path = req.path;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const requestId = getRequestId(req);

  // Log incoming request with request ID
  const requestData: any = {
    requestId,
    method,
    path,
    query: redactSensitiveData(req.query),
    params: redactSensitiveData(req.params),
    body: redactSensitiveData(req.body),
    headers: redactSensitiveData(req.headers),
    ip: clientIp,
    userAgent,
    apiKeyId: (req as any).apiKey?.id || (req as any).user?.apiKeyId,
    userId: (req as any).user?.id,
  };

  logger.request('Incoming request', requestData);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Record performance metric
    performanceMonitor.recordMetric(req, path, statusCode, duration);

    const responseData: any = {
      requestId,
      method,
      path,
      statusCode,
      duration,
      durationMs: `${duration}ms`,
      ip: clientIp,
      userAgent,
      apiKeyId: (req as any).apiKey?.id || (req as any).user?.apiKeyId,
      userId: (req as any).user?.id,
    };

    // Add error details if status code indicates error
    if (statusCode >= 400) {
      responseData.error = true;
    }

    // Log response with appropriate level
    if (statusCode >= 500) {
      logger.error('Request completed with server error', responseData);
    } else if (statusCode >= 400) {
      logger.warn('Request completed with client error', responseData);
    } else {
      logger.response('Request completed successfully', responseData);
    }
  });

  next();
};

/**
 * Error logging middleware with stack traces
 */
export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientIp = getClientIp(req);
  const requestId = getRequestId(req);
  
  logger.error('Request error', {
    requestId,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    request: {
      method: req.method,
      path: req.path,
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      query: redactSensitiveData(req.query),
      params: redactSensitiveData(req.params),
      body: redactSensitiveData(req.body),
    },
    apiKeyId: (req as any).apiKey?.id || (req as any).user?.apiKeyId,
    userId: (req as any).user?.id,
  });

  next(err);
};
