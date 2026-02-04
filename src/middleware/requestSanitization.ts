import { Request, Response, NextFunction } from 'express';
import { sendBadRequest } from '../utils/response';

/**
 * SQL injection patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
  /('|(\\')|(;)|(--)|(\/\*)|(\*\/)|(\+)|(\%27)|(\%3B)|(\%2D)|(\%2D))/gi,
  /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
  /((\%27)|(\'))((\%55)|u|(\%75))((\%4E)|n|(\%6E))((\%49)|i|(\%69))((\%4F)|o|(\%6F))((\%4E)|n|(\%6E))/gi,
  /((\%27)|(\'))((\%6F)|o|(\%4F))((\%52)|r|(\%72))/gi,
  /((\%27)|(\'))((\%55)|u|(\%75))((\%4E)|n|(\%6E))((\%49)|i|(\%69))((\%4F)|o|(\%6F))((\%4E)|n|(\%6E))/gi
];

/**
 * XSS patterns
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick=, onerror=, etc.
  /<img[^>]*src[^>]*=.*?javascript:/gi,
  /<style[^>]*>.*?<\/style>/gi,
  /expression\s*\(/gi
];

/**
 * NoSQL injection patterns
 */
const NOSQL_INJECTION_PATTERNS = [
  /\$where/gi,
  /\$ne/gi,
  /\$gt/gi,
  /\$gte/gi,
  /\$lt/gi,
  /\$lte/gi,
  /\$in/gi,
  /\$nin/gi,
  /\$regex/gi,
  /\$exists/gi,
  /\$elemMatch/gi,
  /\$or/gi,
  /\$and/gi,
  /\$nor/gi,
  /\$not/gi,
  /\$type/gi,
  /\$mod/gi,
  /\$size/gi,
  /\$all/gi,
  /\$slice/gi
];

/**
 * Recursively sanitize object values
 */
const sanitizeValue = (value: any): any => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    let sanitized = value;

    // Check for SQL injection
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        throw new Error('Potential SQL injection detected');
      }
    }

    // Check for XSS
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(sanitized)) {
        throw new Error('Potential XSS attack detected');
      }
    }

    // Check for NoSQL injection
    for (const pattern of NOSQL_INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        throw new Error('Potential NoSQL injection detected');
      }
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'object') {
    const sanitized: any = {};
    for (const [key, val] of Object.entries(value)) {
      // Sanitize key as well
      const sanitizedKey = sanitizeValue(key);
      sanitized[sanitizedKey] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
};

/**
 * Request sanitization middleware
 * Prevents SQL injection, XSS, and NoSQL injection attacks
 */
export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Sanitize query parameters
    if (req.query && Object.keys(req.query).length > 0) {
      req.query = sanitizeValue(req.query) as any;
    }

    // Sanitize body
    if (req.body && Object.keys(req.body).length > 0) {
      req.body = sanitizeValue(req.body);
    }

    // Sanitize params
    if (req.params && Object.keys(req.params).length > 0) {
      req.params = sanitizeValue(req.params) as any;
    }

    next();
  } catch (error) {
    sendBadRequest(req, res, error instanceof Error ? error.message : 'Invalid request data detected', {
      type: 'sanitization_error'
    });
  }
};