import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique request ID
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${uuidv4().substring(0, 8)}`;
};

/**
 * Get or create request ID from response locals
 */
export const getRequestId = (req: Request, res?: Response): string => {
  // Try to get from res.locals first (preferred)
  if (res && res.locals.requestId) {
    return res.locals.requestId;
  }
  
  // Fallback: generate new one
  const requestId = generateRequestId();
  if (res) {
    res.locals.requestId = requestId;
  }
  return requestId;
};

/**
 * Set request start time
 */
export const setRequestStartTime = (req: Request, res?: Response): void => {
  if (res && !res.locals.startTime) {
    res.locals.startTime = Date.now();
  }
};

/**
 * Get request processing time
 */
export const getProcessingTime = (req: Request, res?: Response): number => {
  const startTime = (res && res.locals.startTime) ? res.locals.startTime : Date.now();
  return Date.now() - startTime;
};