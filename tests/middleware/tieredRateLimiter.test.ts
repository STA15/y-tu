import { Request, Response, NextFunction } from 'express';
import { tieredRateLimiter } from '../../src/middleware/tieredRateLimiter';
import { ApiKeyRequest } from '../../src/middleware/apiKeyAuth';
import { ApiKeyTier, TIER_RATE_LIMITS } from '../../src/models/apiKey.model';
import { apiKeyStore } from '../../src/services/apiKeyStore.service';
import { AppError } from '../../src/middleware/errorHandler';
import { createMockApiKeyRequest, createMockResponse, createMockNext, createTestApiKey } from '../helpers/testHelpers';

// Mock the API key store
jest.mock('../../src/services/apiKeyStore.service', () => ({
  apiKeyStore: {
    getDailyRequestCount: jest.fn(),
  },
}));

describe('Tiered Rate Limiter Middleware', () => {
  let req: Partial<ApiKeyRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = createMockApiKeyRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('Rate limiting by tier', () => {
    it('should allow request when under daily limit', () => {
      const apiKey = createTestApiKey({ tier: ApiKeyTier.FREE });
      req.apiKey = apiKey;
      (apiKeyStore.getDailyRequestCount as jest.Mock).mockReturnValue(50); // Under limit of 100

      tieredRateLimiter(req as ApiKeyRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Tier', ApiKeyTier.FREE);
    });

    it('should block request when daily limit exceeded', () => {
      const apiKey = createTestApiKey({ tier: ApiKeyTier.FREE });
      req.apiKey = apiKey;
      (apiKeyStore.getDailyRequestCount as jest.Mock).mockReturnValue(100); // At limit

      tieredRateLimiter(req as ApiKeyRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 429,
          message: expect.stringContaining('Rate limit exceeded'),
        })
      );
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '86400');
    });

    it('should allow unlimited requests for ENTERPRISE tier', () => {
      const apiKey = createTestApiKey({ tier: ApiKeyTier.ENTERPRISE });
      req.apiKey = apiKey;
      (apiKeyStore.getDailyRequestCount as jest.Mock).mockReturnValue(1000000); // Way over normal limit

      tieredRateLimiter(req as ApiKeyRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 'unlimited');
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 'unlimited');
    });

    it('should handle missing API key gracefully', () => {
      req.apiKey = undefined;

      tieredRateLimiter(req as ApiKeyRequest, res as Response, next);

      expect(next).toHaveBeenCalled(); // Should continue without rate limiting
    });

    it('should set correct rate limit headers for PRO tier', () => {
      const apiKey = createTestApiKey({ tier: ApiKeyTier.PRO });
      req.apiKey = apiKey;
      (apiKeyStore.getDailyRequestCount as jest.Mock).mockReturnValue(5000);

      tieredRateLimiter(req as ApiKeyRequest, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10000');
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Tier', ApiKeyTier.PRO);
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully', () => {
      const apiKey = createTestApiKey();
      req.apiKey = apiKey;
      (apiKeyStore.getDailyRequestCount as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      tieredRateLimiter(req as ApiKeyRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Rate limit check failed',
        })
      );
    });
  });
});
