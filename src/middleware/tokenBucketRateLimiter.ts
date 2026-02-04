import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Token Bucket implementation for rate limiting
 */
interface TokenBucket {
  tokens: number;
  capacity: number;
  refillRate: number; // tokens per second
  lastRefill: number;
}

class TokenBucketRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup old buckets every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Create or get token bucket for a key
   */
  private getBucket(key: string, capacity: number, refillRate: number): TokenBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: capacity,
        capacity,
        refillRate,
        lastRefill: Date.now()
      });
    }
    return this.buckets.get(key)!;
  }

  /**
   * Refill tokens based on elapsed time
   * 
   * The Token Bucket algorithm refills tokens at a constant rate.
   * This method calculates how many tokens should be added based on:
   * - Elapsed time since last refill
   * - Refill rate (tokens per second)
   * 
   * Tokens are capped at the bucket capacity to prevent overflow.
   * 
   * @param bucket - The token bucket to refill
   */
  private refill(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * bucket.refillRate;
    
    // Cap tokens at capacity to prevent overflow
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * Check if request is allowed and consume a token
   * 
   * This is the core rate limiting logic:
   * 1. Get or create bucket for the key
   * 2. Refill tokens based on elapsed time
   * 3. If tokens available (>= 1), consume one and allow request
   * 4. Otherwise, deny request (rate limit exceeded)
   * 
   * @param key - Unique identifier for the rate limit (e.g., IP address, API key)
   * @param capacity - Maximum tokens in the bucket
   * @param refillRate - Tokens added per second
   * @returns true if request is allowed, false if rate limit exceeded
   */
  consume(key: string, capacity: number, refillRate: number): boolean {
    const bucket = this.getBucket(key, capacity, refillRate);
    this.refill(bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get remaining tokens (without consuming)
   */
  getRemaining(key: string, capacity: number, refillRate: number): number {
    const bucket = this.getBucket(key, capacity, refillRate);
    this.refill(bucket);
    return Math.floor(bucket.tokens);
  }

  /**
   * Cleanup old buckets (older than 1 hour)
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.lastRefill < oneHourAgo && bucket.tokens >= bucket.capacity) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Destroy the limiter and cleanup
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.buckets.clear();
  }
}

// Global instance
const tokenBucketLimiter = new TokenBucketRateLimiter();

/**
 * Get client identifier (IP address or API key)
 */
const getClientId = (req: Request): string => {
  // Try to get API key first (for authenticated requests)
  const apiKey = (req as any).apiKey?.id;
  if (apiKey) {
    return `api_key:${apiKey}`;
  }

  // Fall back to IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0])
    : req.socket.remoteAddress || 'unknown';

  return `ip:${ip}`;
};

/**
 * Global rate limiter: 100 requests per minute
 */
export const globalTokenBucketLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const key = 'global';
  const capacity = 100; // tokens
  const refillRate = 100 / 60; // tokens per second (100 per minute)

  if (!tokenBucketLimiter.consume(key, capacity, refillRate)) {
    const remaining = tokenBucketLimiter.getRemaining(key, capacity, refillRate);
    res.setHeader('X-RateLimit-Limit', capacity.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('Retry-After', Math.ceil((capacity - remaining) / refillRate).toString());
    
    return next(new AppError('Global rate limit exceeded. Please try again later.', 429));
  }

  const remaining = tokenBucketLimiter.getRemaining(key, capacity, refillRate);
  res.setHeader('X-RateLimit-Limit', capacity.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  next();
};

/**
 * Per-IP rate limiter: 50 requests per minute
 */
export const perIpTokenBucketLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientId = getClientId(req);
  const key = `ip:${clientId}`;
  const capacity = 50; // tokens
  const refillRate = 50 / 60; // tokens per second (50 per minute)

  if (!tokenBucketLimiter.consume(key, capacity, refillRate)) {
    const remaining = tokenBucketLimiter.getRemaining(key, capacity, refillRate);
    res.setHeader('X-RateLimit-Limit', capacity.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('Retry-After', Math.ceil((capacity - remaining) / refillRate).toString());
    
    return next(new AppError('Rate limit exceeded for your IP. Please try again later.', 429));
  }

  const remaining = tokenBucketLimiter.getRemaining(key, capacity, refillRate);
  res.setHeader('X-RateLimit-Limit', capacity.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  next();
};

/**
 * Throttle limiter: 50 requests per second
 */
export const throttleTokenBucketLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientId = getClientId(req);
  const key = `throttle:${clientId}`;
  const capacity = 50; // tokens
  const refillRate = 50; // tokens per second

  if (!tokenBucketLimiter.consume(key, capacity, refillRate)) {
    const remaining = tokenBucketLimiter.getRemaining(key, capacity, refillRate);
    res.setHeader('X-RateLimit-Limit', capacity.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('Retry-After', '1');
    
    return next(new AppError('Too many requests per second. Please slow down.', 429));
  }

  const remaining = tokenBucketLimiter.getRemaining(key, capacity, refillRate);
  res.setHeader('X-RateLimit-Limit', capacity.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  next();
};
