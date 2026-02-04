import {
  createApiKey,
  getUserApiKeys,
  deactivateApiKey,
  reactivateApiKey,
  deleteApiKey,
  getApiKeyUsage,
  getTierInfo,
  getAllTiers,
  getApiKeyInfo,
} from '../../src/utils/apiKey.utils';
import { apiKeyStore } from '../../src/services/apiKeyStore.service';
import { ApiKeyTier } from '../../src/models/apiKey.model';
import { createTestApiKey } from '../helpers/testHelpers';

// Mock the API key store
jest.mock('../../src/services/apiKeyStore.service', () => ({
  apiKeyStore: {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findByKey: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getUsage: jest.fn(),
  },
}));

describe('API Key Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createApiKey', () => {
    it('should create a new API key', () => {
      const options = {
        name: 'Test Key',
        tier: ApiKeyTier.FREE,
        userId: 'test-user-id',
      };

      const mockApiKey = createTestApiKey(options);
      (apiKeyStore.create as jest.Mock).mockReturnValue(mockApiKey);

      const result = createApiKey(options);

      expect(result).toBeDefined();
      expect(result.key).toMatch(/^ytu_/);
      expect(result.tier).toBe(options.tier);
      expect(result.name).toBe(options.name);
      expect(apiKeyStore.create).toHaveBeenCalled();
    });

    it('should create API key with default tier if not specified', () => {
      const options = {
        name: 'Test Key',
        userId: 'test-user-id',
      };

      const mockApiKey = createTestApiKey({ ...options, tier: ApiKeyTier.FREE });
      (apiKeyStore.create as jest.Mock).mockReturnValue(mockApiKey);

      const result = createApiKey(options);

      expect(result.tier).toBe(ApiKeyTier.FREE);
    });
  });

  describe('getUserApiKeys', () => {
    it('should return all API keys for a user', () => {
      const userId = 'test-user-id';
      const mockKeys = [
        createTestApiKey({ userId, name: 'Key 1' }),
        createTestApiKey({ userId, name: 'Key 2' }),
      ];

      (apiKeyStore.findByUserId as jest.Mock).mockReturnValue(mockKeys);

      const result = getUserApiKeys(userId);

      expect(result).toEqual(mockKeys);
      expect(apiKeyStore.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return empty array when user has no keys', () => {
      const userId = 'test-user-id';
      (apiKeyStore.findByUserId as jest.Mock).mockReturnValue([]);

      const result = getUserApiKeys(userId);

      expect(result).toEqual([]);
    });
  });

  describe('deactivateApiKey', () => {
    it('should deactivate an API key', () => {
      const apiKey = createTestApiKey({ isActive: true });
      const deactivatedKey = { ...apiKey, isActive: false };

      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(apiKey);
      (apiKeyStore.update as jest.Mock).mockReturnValue(deactivatedKey);

      const result = deactivateApiKey(apiKey.key);

      expect(result).toBeDefined();
      expect(result.isActive).toBe(false);
      expect(apiKeyStore.update).toHaveBeenCalledWith(
        apiKey.id,
        expect.objectContaining({ isActive: false })
      );
    });

    it('should throw error when API key not found', () => {
      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(null);

      expect(() => deactivateApiKey('invalid-key')).toThrow();
    });
  });

  describe('reactivateApiKey', () => {
    it('should reactivate an API key', () => {
      const apiKey = createTestApiKey({ isActive: false });
      const reactivatedKey = { ...apiKey, isActive: true };

      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(apiKey);
      (apiKeyStore.update as jest.Mock).mockReturnValue(reactivatedKey);

      const result = reactivateApiKey(apiKey.key);

      expect(result).toBeDefined();
      expect(result.isActive).toBe(true);
    });
  });

  describe('deleteApiKey', () => {
    it('should delete an API key', () => {
      const apiKey = createTestApiKey();
      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(apiKey);
      (apiKeyStore.delete as jest.Mock).mockReturnValue(true);

      const result = deleteApiKey(apiKey.key);

      expect(result).toBe(true);
      expect(apiKeyStore.delete).toHaveBeenCalledWith(apiKey.id);
    });

    it('should return false when API key not found', () => {
      (apiKeyStore.findByKey as jest.Mock).mockReturnValue(null);

      const result = deleteApiKey('invalid-key');

      expect(result).toBe(false);
    });
  });

  describe('getApiKeyUsage', () => {
    it('should return API key usage statistics', () => {
      const apiKeyId = 'test-key-id';
      const date = '2023-12-21';
      const mockUsage = {
        apiKeyId,
        date,
        requestCount: 100,
        lastRequestAt: new Date().toISOString(),
      };

      (apiKeyStore.getUsage as jest.Mock).mockReturnValue(mockUsage);

      const result = getApiKeyUsage(apiKeyId, date);

      expect(result).toEqual(mockUsage);
      expect(apiKeyStore.getUsage).toHaveBeenCalledWith(apiKeyId, date);
    });
  });

  describe('getTierInfo', () => {
    it('should return tier information', () => {
      const tierInfo = getTierInfo(ApiKeyTier.FREE);

      expect(tierInfo).toBeDefined();
      expect(tierInfo.tier).toBe(ApiKeyTier.FREE);
      expect(tierInfo.requestsPerDay).toBeDefined();
    });
  });

  describe('getAllTiers', () => {
    it('should return all available tiers', () => {
      const tiers = getAllTiers();

      expect(tiers).toContain(ApiKeyTier.FREE);
      expect(tiers).toContain(ApiKeyTier.STARTER);
      expect(tiers).toContain(ApiKeyTier.PRO);
      expect(tiers).toContain(ApiKeyTier.ENTERPRISE);
    });
  });

  describe('getApiKeyInfo', () => {
    it('should return API key info without sensitive data', () => {
      const apiKey = createTestApiKey();

      const info = getApiKeyInfo(apiKey);

      expect(info).toBeDefined();
      expect(info.id).toBe(apiKey.id);
      expect(info.tier).toBe(apiKey.tier);
      expect(info.name).toBe(apiKey.name);
      expect(info.key).toBeUndefined(); // Key should not be included
    });
  });
});
