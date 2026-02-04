import { Request, Response, NextFunction } from 'express';
import { getRapidAPIConfig, mapRapidAPIPlanToTier, isRapidAPIEnabled } from '../config/rapidapi.config';
import { ApiKeyTier } from '../models/apiKey.model';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';

/**
 * RapidAPI request interface
 */
export interface RapidAPIRequest extends Request {
  rapidapi?: {
    user: string;
    subscription: string;
    plan: string;
    tier: ApiKeyTier;
    proxySecret: string;
  };
  user?: {
    id: string;
    tier: ApiKeyTier;
    rapidapiUser?: string;
    rapidapiSubscription?: string;
  };
}

/**
 * Validate RapidAPI proxy secret
 */
const validateProxySecret = (secret: string): boolean => {
  const config = getRapidAPIConfig();
  
  if (!config.enabled) {
    return false;
  }

  if (!config.proxySecret) {
    logger.warn('RapidAPI proxy secret not configured');
    return false;
  }

  return secret === config.proxySecret;
};

/**
 * Extract RapidAPI information from headers
 */
const extractRapidAPIInfo = (req: Request): {
  user: string | undefined;
  subscription: string | undefined;
  proxySecret: string | undefined;
} => {
  return {
    user: (req.headers['x-rapidapi-user'] as string) || undefined,
    subscription: (req.headers['x-rapidapi-subscription'] as string) || undefined,
    proxySecret: (req.headers['x-rapidapi-proxy-secret'] as string) || undefined,
  };
};

/**
 * RapidAPI authentication middleware
 * Validates RapidAPI proxy secret and extracts user/subscription info
 */
export const rapidapiAuth = (
  req: RapidAPIRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check if RapidAPI is enabled
    if (!isRapidAPIEnabled()) {
      return next(); // Skip if not enabled
    }

    const rapidapiInfo = extractRapidAPIInfo(req);

    // If no RapidAPI headers, skip (will use regular API key auth)
    if (!rapidapiInfo.proxySecret && !rapidapiInfo.user) {
      return next();
    }

    // Validate proxy secret if provided
    if (rapidapiInfo.proxySecret) {
      if (!validateProxySecret(rapidapiInfo.proxySecret)) {
        logger.security('Invalid RapidAPI proxy secret', {
          requestId: getRequestId(req, res),
          ip: req.ip,
          path: req.path,
        });

        throw new AppError('Invalid RapidAPI proxy secret', 401);
      }
    }

    // Extract plan from subscription header
    const plan = rapidapiInfo.subscription || 'free';
    const tier = mapRapidAPIPlanToTier(plan) as ApiKeyTier;

    // Attach RapidAPI info to request
    req.rapidapi = {
      user: rapidapiInfo.user || 'unknown',
      subscription: rapidapiInfo.subscription || 'free',
      plan,
      tier,
      proxySecret: rapidapiInfo.proxySecret || '',
    };

    // Set user info for compatibility
    req.user = {
      id: `rapidapi_${rapidapiInfo.user || 'unknown'}`,
      tier,
      rapidapiUser: rapidapiInfo.user,
      rapidapiSubscription: rapidapiInfo.subscription,
    };

    // Log RapidAPI request
    logger.info('RapidAPI request authenticated', {
      requestId: getRequestId(req, res),
      rapidapiUser: rapidapiInfo.user,
      subscription: rapidapiInfo.subscription,
      plan,
      tier,
      path: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('RapidAPI authentication failed', 401));
    }
  }
};

/**
 * Optional RapidAPI authentication (doesn't fail if not present)
 */
export const optionalRapidAPIAuth = (
  req: RapidAPIRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!isRapidAPIEnabled()) {
      return next();
    }

    const rapidapiInfo = extractRapidAPIInfo(req);

    if (rapidapiInfo.proxySecret && !validateProxySecret(rapidapiInfo.proxySecret)) {
      // Invalid secret, but don't fail (will use regular auth)
      return next();
    }

    if (rapidapiInfo.user || rapidapiInfo.subscription) {
      const plan = rapidapiInfo.subscription || 'free';
      const tier = mapRapidAPIPlanToTier(plan) as ApiKeyTier;

      req.rapidapi = {
        user: rapidapiInfo.user || 'unknown',
        subscription: rapidapiInfo.subscription || 'free',
        plan,
        tier,
        proxySecret: rapidapiInfo.proxySecret || '',
      };

      req.user = {
        id: `rapidapi_${rapidapiInfo.user || 'unknown'}`,
        tier,
        rapidapiUser: rapidapiInfo.user,
        rapidapiSubscription: rapidapiInfo.subscription,
      };
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};