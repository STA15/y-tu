import { Request, Response, NextFunction } from 'express';
import { authenticateApiKey, optionalApiKeyAuth } from '../../src/middleware/apiKeyAuth';
import { ApiKeyRequest } from '../../src/middleware/apiKeyAuth';
import { AppError } from '../../src/middleware/errorHandler';
import { apiKeyStore } from '../../src/services/apiKeyStore.service';
import { ApiKeyTier } from '../../src/models/apiKey.model';
import { createMockRequest, createMockResponse, createMockNext, createTestApiKey } from '../helpers/testHelpers';

// Mock the API key store
jest.mock('../../src/services/apiKeyStore.service', () => ({
  apiKeyStore: {
    findByKey: jest.fn(),
    recordUsage: jest.fn(),
  },
}));

describe('API Key Authentication Middleware', () => {
  let req: Partial<ApiKeyRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('authenticateApiKey', () => {
    it('should authenticate request with X-API-Key header', () => {
      const apiKey = createTestApiKey({ tier: ApiKeyTier.PRO });
      req.headers = { 'x-api-key': apiKey.key };
      
      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(apiKey);

      authenticateApiKey(req as ApiKeyRequest, res as Response, next);

      expect(apiKeyStore.findByKey).toHaveBeenCalledWith(apiKey.key);
      expect(req.apiKey).toEqual(apiKey);
      expect(req.user).toBeDefined();
      expect(req.user?.tier).toBe(ApiKeyTier.PRO);
      expect(apiKeyStore.recordUsage).toHaveBeenCalledWith(apiKey.id);
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate request with Bearer token', () => {
      const apiKey = createTestApiKey();
      req.headers = { authorization: `Bearer ${apiKey.key}` };
      
      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(apiKey);

      authenticateApiKey(req as ApiKeyRequest, res as Response, next);

      expect(apiKeyStore.findByKey).toHaveBeenCalledWith(apiKey.key);
      expect(req.apiKey).toEqual(apiKey);
      expect(next).toHaveBeenCalled();
    });

    it('should throw 401 error when API key is missing', () => {
      req.headers = {};

      authenticateApiKey(req as ApiKeyRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining('API key is required'),
        })
      );
    });

    it('should throw 401 error when API key is invalid', () => {
      req.headers = { 'x-api-key': 'invalid-key' };
      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(null);

      authenticateApiKey(req as ApiKeyRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid API key',
        })
      );
    });

    it('should throw 401 error when API key is deactivated', () => {
      const apiKey = createTestApiKey({ isActive: false });
      req.headers = { 'x-api-key': apiKey.key };
      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(apiKey);

      authenticateApiKey(req as ApiKeyRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'API key is deactivated',
        })
      );
    });

    it('should handle errors gracefully', () => {
      req.headers = { 'x-api-key': 'test-key' };
      (apiKeyStore.findByKey as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      authenticateApiKey(req as ApiKeyRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'API key authentication failed',
        })
      );
    });
  });

  describe('optionalApiKeyAuth', () => {
    it('should authenticate when API key is provided', () => {
      const apiKey = createTestApiKey();
      req.headers = { 'x-api-key': apiKey.key };
      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(apiKey);

      optionalApiKeyAuth(req as ApiKeyRequest, res as Response, next);

      expect(req.apiKey).toEqual(apiKey);
      expect(apiKeyStore.recordUsage).toHaveBeenCalledWith(apiKey.id);
      expect(next).toHaveBeenCalled();
    });

    it('should continue without authentication when API key is not provided', () => {
      req.headers = {};

      optionalApiKeyAuth(req as ApiKeyRequest, res as Response, next);

      expect(req.apiKey).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without authentication when API key is invalid', () => {
      req.headers = { 'x-api-key': 'invalid-key' };
      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(null);

      optionalApiKeyAuth(req as ApiKeyRequest, res as Response, next);

      expect(req.apiKey).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without authentication on errors', () => {
      req.headers = { 'x-api-key': 'test-key' };
      (apiKeyStore.findByKey as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      optionalApiKeyAuth(req as ApiKeyRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
