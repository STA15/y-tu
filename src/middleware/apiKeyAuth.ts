import { Request, Response, NextFunction } from 'express';
import { ApiKey } from '../models/apiKey.model';
import { apiKeyStore } from '../services/apiKeyStore.service';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Extended request with API key information
 */
export interface ApiKeyRequest extends Request {
  apiKey?: ApiKey;
  // Remove the user property - it's now defined globally in express.d.ts
}

// Rest of the file stays the same...

/**
 * Extract API key from request headers
 */
const extractApiKey = (req: Request): string | null => {
  // Try X-API-Key header first
  const apiKeyHeader = req.headers['x-api-key'] as string;
  if (apiKeyHeader) {
    return apiKeyHeader.trim();
  }

  // Try Authorization header with Bearer token (for future OAuth support)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    // Check if it's an API key (starts with ytu_)
    if (token.startsWith('ytu_')) {
      return token;
    }
    // Otherwise, it's a JWT token (handled by JWT auth middleware)
    return null;
  }

  return null;
};

/**
 * API Key authentication middleware
 * Supports both X-API-Key header and Bearer token format
 */
export const authenticateApiKey = (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const apiKeyString = extractApiKey(req);

    if (!apiKeyString) {
      throw new AppError('API key is required. Provide X-API-Key header or Bearer token.', 401);
    }

    // Find API key in store
    const apiKey = apiKeyStore.findByKey(apiKeyString);

    if (!apiKey) {
      throw new AppError('Invalid API key', 401);
    }

    if (!apiKey.isActive) {
      throw new AppError('API key is deactivated', 401);
    }

    // Attach API key and user info to request
    req.apiKey = apiKey;
    req.user = {
      id: apiKey.userId || apiKey.id,
      tier: apiKey.tier,
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name
    };

    // Record usage
    apiKeyStore.recordUsage(apiKey.id);

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('API key authentication failed', 401));
    }
  }
};

/**
 * Optional API key authentication (doesn't fail if no key provided)
 * Useful for endpoints that support both authenticated and anonymous access
 */
export const optionalApiKeyAuth = (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const apiKeyString = extractApiKey(req);

    if (apiKeyString) {
      const apiKey = apiKeyStore.findByKey(apiKeyString);
      
      if (apiKey && apiKey.isActive) {
        req.apiKey = apiKey;
        req.user = {
          id: apiKey.userId || apiKey.id,
          tier: apiKey.tier,
          apiKeyId: apiKey.id,
          apiKeyName: apiKey.name
        };
        apiKeyStore.recordUsage(apiKey.id);
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors, just continue
    next();
  }
};
