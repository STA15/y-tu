import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';
import { AppError } from './errorHandler';

/**
 * CSRF protection configuration
 * Only applies to state-changing methods (POST, PUT, DELETE, PATCH)
 */
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

/**
 * CSRF protection middleware
 * Only applies to state-changing HTTP methods
 */
export const csrfMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip CSRF for GET, HEAD, OPTIONS
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints (API keys provide authentication)
  // CSRF is mainly for web forms
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // Apply CSRF protection
  csrfProtection(req as any, res as any, (err: any) => {
    if (err) {
      if (err.code === 'EBADCSRFTOKEN') {
        return next(new AppError('Invalid CSRF token', 403));
      }
      return next(err);
    }

    // Add CSRF token to response for forms
    const csrfToken = (req as any).csrfToken;
    if (csrfToken && typeof csrfToken === 'function') {
      res.locals.csrfToken = csrfToken();
    }
    next();
  });
};

/**
 * Get CSRF token endpoint (for forms)
 */
export const getCsrfToken = (req: Request, res: Response): void => {
  const csrfToken = (req as any).csrfToken;
  const token = csrfToken && typeof csrfToken === 'function' ? csrfToken() : null;
  res.json({
    success: true,
    data: {
      csrfToken: token
    }
  });
};