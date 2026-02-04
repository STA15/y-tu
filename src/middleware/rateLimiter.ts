import rateLimit from 'express-rate-limit';
import { config } from '../config/config';

/**
 * Standard rate limiter: 100 requests per minute
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: config.rateLimit.message
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Throttle limiter: 50 requests per second
 * Use this for more strict rate limiting on specific endpoints
 */
export const throttleLimiter = rateLimit({
  windowMs: config.rateLimit.throttleWindowMs,
  max: config.rateLimit.throttleMaxRequests,
  message: {
    error: 'Too many requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter: 10 requests per 15 minutes
 * Use this for sensitive endpoints like authentication
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
