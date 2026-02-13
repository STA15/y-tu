import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { authenticateApiKey, ApiKeyRequest } from './apiKeyAuth';
import { rapidapiAuth, RapidAPIRequest, optionalRapidAPIAuth } from './rapidapiAuth';
import { isRapidAPIEnabled } from '../config/rapidapi.config';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    tier?: string;
    rapidapiUser?: string;
    rapidapiSubscription?: string;
    [key: string]: any;
  };
  apiKey?: any;
  rapidapi?: any;
}

/**
 * Unified authentication middleware
 * Supports:
 * 1. RapidAPI proxy authentication (if enabled)
 * 2. Direct API Key (X-API-Key header)
 * 3. Bearer token (JWT or API key)
 *
 * Priority: RapidAPI > API Key > JWT
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First, try RapidAPI authentication (if enabled)
    if (isRapidAPIEnabled()) {
      const rapidapiInfo = {
        user: req.headers['x-rapidapi-user'] as string,
        subscription: req.headers['x-rapidapi-subscription'] as string,
        proxySecret: req.headers['x-rapidapi-proxy-secret'] as string,
      };

      // If RapidAPI headers are present, use RapidAPI auth
      if (rapidapiInfo.proxySecret || rapidapiInfo.user) {
        return rapidapiAuth(req as RapidAPIRequest, res, (err) => {
          if (err) {
            // RapidAPI auth failed, try fallback
            return tryFallbackAuth(req, res, next);
          }
          next();
        });
      }
    }

    // Fallback to regular authentication
    await tryFallbackAuth(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * Try fallback authentication methods (API Key or JWT)
 */
const tryFallbackAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Check for API key
  const apiKeyHeader = req.headers['x-api-key'] as string;
  const authHeader = req.headers.authorization;

  // If X-API-Key header is present, use API key authentication
  if (apiKeyHeader) {
    return await authenticateApiKey(req as ApiKeyRequest, res, next);
  }

  // If Bearer token is present and doesn't look like an API key, use JWT authentication
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();

    // If it's an API key (starts with ytu_), use API key auth
    if (token.startsWith('ytu_')) {
      return await authenticateApiKey(req as ApiKeyRequest, res, next);
    }

    // Otherwise, it's a JWT token
    return authenticateJWT(req, res, next);
  }

  // No authentication provided
  throw new AppError(
    'Authentication required. Provide X-API-Key header, Bearer token, or RapidAPI headers.',
    401
  );
};

/**
 * JWT Bearer token authentication
 * TODO: Implement actual JWT verification
 */
const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Bearer token is required', 401);
    }

    const token = authHeader.substring(7).trim();

    // TODO: Implement JWT verification logic
    // const decoded = jwt.verify(token, config.jwt.secret);
    // req.user = decoded;

    // Placeholder for development
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        id: 'dev-user-id',
        email: 'dev@example.com'
      };
    } else {
      throw new AppError('Invalid or expired token', 401);
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('JWT authentication failed', 401));
    }
  }
};