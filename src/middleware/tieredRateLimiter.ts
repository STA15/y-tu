import { Request, Response, NextFunction } from 'express';
import { ApiKeyRequest } from './apiKeyAuth';
import { ApiKeyTier, TIER_RATE_LIMITS } from '../models/apiKey.model';
import { apiKeyStore } from '../services/apiKeyStore.service';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';

/**
 * Rate limit storage for per-API-key rate limiting
 */
interface RateLimitState {
  dailyCount: number;
  minuteCount: number;
  secondCount: number;
  lastMinuteReset: number;
  lastSecondReset: number;
  lastDayReset: string; // YYYY-MM-DD
}

const rateLimitStates = new Map<string, RateLimitState>();

/**
 * Get or create rate limit state for an API key
 */
const getRateLimitState = (apiKeyId: string): RateLimitState => {
  if (!rateLimitStates.has(apiKeyId)) {
    rateLimitStates.set(apiKeyId, {
      dailyCount: 0,
      minuteCount: 0,
      secondCount: 0,
      lastMinuteReset: Date.now(),
      lastSecondReset: Date.now(),
      lastDayReset: new Date().toISOString().split('T')[0]
    });
  }
  return rateLimitStates.get(apiKeyId)!;
};

/**
 * Reset counters if time windows have passed
 */
const resetCountersIfNeeded = (state: RateLimitState): void => {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  // Reset daily counter if new day
  if (state.lastDayReset !== today) {
    state.dailyCount = 0;
    state.lastDayReset = today;
  }

  // Reset minute counter if minute passed
  if (now - state.lastMinuteReset >= 60 * 1000) {
    state.minuteCount = 0;
    state.lastMinuteReset = now;
  }

  // Reset second counter if second passed
  if (now - state.lastSecondReset >= 1000) {
    state.secondCount = 0;
    state.lastSecondReset = now;
  }
};

/**
 * Check if request exceeds rate limits
 */
const checkRateLimit = (apiKeyId: string, tier: ApiKeyTier): { allowed: boolean; reason?: string } => {
  const limits = TIER_RATE_LIMITS[tier];
  const state = getRateLimitState(apiKeyId);
  
  resetCountersIfNeeded(state);

  // Check daily limit
  if (limits.requestsPerDay !== Infinity) {
    const dailyUsage = apiKeyStore.getDailyRequestCount(apiKeyId);
    if (dailyUsage >= limits.requestsPerDay) {
      return {
        allowed: false,
        reason: `Daily limit of ${limits.requestsPerDay} requests exceeded`
      };
    }
  }

  // Check per-minute limit
  if (limits.requestsPerMinute !== undefined && limits.requestsPerMinute !== Infinity) {
    if (state.minuteCount >= limits.requestsPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit of ${limits.requestsPerMinute} requests per minute exceeded`
      };
    }
  }

  // Check per-second limit
  if (limits.requestsPerSecond !== undefined && limits.requestsPerSecond !== Infinity) {
    if (state.secondCount >= limits.requestsPerSecond) {
      return {
        allowed: false,
        reason: `Rate limit of ${limits.requestsPerSecond} requests per second exceeded`
      };
    }
  }

  return { allowed: true };
};

/**
 * Increment rate limit counters
 */
const incrementCounters = (apiKeyId: string): void => {
  const state = getRateLimitState(apiKeyId);
  resetCountersIfNeeded(state);
  
  state.dailyCount++;
  state.minuteCount++;
  state.secondCount++;
};

/**
 * Tiered rate limiting middleware
 * Must be used after authenticateApiKey middleware
 */
export const tieredRateLimiter = (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check for RapidAPI user first (if enabled)
    const rapidapi = (req as any).rapidapi;
    if (rapidapi && rapidapi.tier) {
      const tier = rapidapi.tier as ApiKeyTier;
      // Use RapidAPI tier for rate limiting
      const check = checkRateLimit(
        `rapidapi_${rapidapi.user}`,
        tier
      );

      if (!check.allowed) {
        const error = new AppError(
          `Rate limit exceeded: ${check.reason}`,
          429
        );
        
        const limits = TIER_RATE_LIMITS[tier];
        res.setHeader('X-RateLimit-Limit', limits.requestsPerDay.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('Retry-After', '86400');
        
        return next(error);
      }

      incrementCounters(`rapidapi_${rapidapi.user}`);
      
      const limits = TIER_RATE_LIMITS[tier];
      res.setHeader('X-RateLimit-Limit', limits.requestsPerDay === Infinity ? 'unlimited' : limits.requestsPerDay.toString());
      res.setHeader('X-RateLimit-Remaining', 'unlimited'); // RapidAPI handles their own tracking
      res.setHeader('X-RateLimit-Tier', tier);
      
      return next();
    }

    // If no API key, skip rate limiting (will be handled by auth middleware)
    if (!req.apiKey) {
      return next();
    }

    const { apiKey } = req;
    const check = checkRateLimit(apiKey.id, apiKey.tier);

    if (!check.allowed) {
      const requestId = getRequestId(req, res);
      
      // Log rate limit hit
      logger.security('Rate limit exceeded', {
        requestId,
        apiKeyId: apiKey.id,
        tier: apiKey.tier,
        reason: check.reason,
        dailyUsage: apiKeyStore.getDailyRequestCount(apiKey.id),
        limit: TIER_RATE_LIMITS[apiKey.tier].requestsPerDay,
        endpoint: req.path,
        method: req.method,
        ip: req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown',
      });

      const error = new AppError(
        `Rate limit exceeded: ${check.reason}`,
        429
      );
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', TIER_RATE_LIMITS[apiKey.tier].requestsPerDay.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', '86400'); // Retry after 24 hours
      
      return next(error);
    }

    // Increment counters
    incrementCounters(apiKey.id);

    // Add rate limit headers
    const limits = TIER_RATE_LIMITS[apiKey.tier];
    const dailyUsage = apiKeyStore.getDailyRequestCount(apiKey.id);
    const remaining = limits.requestsPerDay === Infinity 
      ? 'unlimited' 
      : Math.max(0, limits.requestsPerDay - dailyUsage).toString();

    res.setHeader('X-RateLimit-Limit', limits.requestsPerDay === Infinity ? 'unlimited' : limits.requestsPerDay.toString());
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Tier', apiKey.tier);

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Rate limit check failed', 500));
    }
  }
};

/**
 * Cleanup old rate limit states (older than 1 day)
 */
setInterval(() => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  for (const [apiKeyId, state] of rateLimitStates.entries()) {
    const lastReset = new Date(state.lastDayReset).getTime();
    if (lastReset < oneDayAgo) {
      rateLimitStates.delete(apiKeyId);
    }
  }
}, 60 * 60 * 1000); // Cleanup every hour