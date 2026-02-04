import slowDown, { Options } from 'express-slow-down';
import { Request, Response } from 'express';

/**
 * Slow down middleware for DDoS protection
 * Gradually increases response time for repeated requests
 */
export const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Start delaying after 50 requests
  delayMs: (hits) => hits * 100, // Increase delay by 100ms per request
  maxDelayMs: 2000, // Maximum delay of 2 seconds
  skipSuccessfulRequests: false,
  skipFailedRequests: false
} as Partial<Options>);

/**
 * Strict slow down for sensitive endpoints
 */
export const strictSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // Start delaying after 10 requests
  delayMs: (hits) => hits * 500, // Increase delay by 500ms per request
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  skipSuccessfulRequests: false,
  skipFailedRequests: false
} as Partial<Options>);