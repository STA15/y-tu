import { ApiKey, ApiKeyTier, CreateApiKeyRequest } from '../models/apiKey.model';
import { apiKeyStore } from '../services/apiKeyStore.service';
import { logger } from './logger';

/**
 * API Key management utilities
 */

/**
 * Create a new API key
 */
export const createApiKey = async (request: CreateApiKeyRequest): Promise<ApiKey> => {
  return await apiKeyStore.create(request);
};

/**
 * Validate API key format
 */
export const isValidApiKeyFormat = (key: string): boolean => {
  return typeof key === 'string' && key.startsWith('ytu_') && key.length > 40;
};

/**
 * Get API key information (without exposing the full key)
 */
export const getApiKeyInfo = (apiKey: ApiKey) => {
  return {
    id: apiKey.id,
    name: apiKey.name,
    tier: apiKey.tier,
    createdAt: apiKey.createdAt,
    lastUsedAt: apiKey.lastUsedAt,
    isActive: apiKey.isActive,
    // Mask the key (show only first 8 and last 4 characters)
    keyPreview: apiKey.key.substring(0, 8) + '...' + apiKey.key.substring(apiKey.key.length - 4)
  };
};

/**
 * Get usage statistics for an API key
 */
export const getApiKeyUsage = async (apiKeyId: string, date?: string) => {
  return await apiKeyStore.getUsage(apiKeyId, date);
};

/**
 * Get all API keys for a user
 */
export const getUserApiKeys = async (userId: string): Promise<ApiKey[]> => {
  return await apiKeyStore.findByUserId(userId);
};

/**
 * Deactivate an API key
 */
export const deactivateApiKey = async (key: string): Promise<boolean> => {
  return await apiKeyStore.deactivate(key);
};

/**
 * Reactivate an API key
 */
export const reactivateApiKey = async (key: string): Promise<boolean> => {
  const apiKey = await apiKeyStore.findByKey(key);
  if (!apiKey) {
    return false;
  }
  await apiKeyStore.update(key, { isActive: true });
  return true;
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (key: string): Promise<boolean> => {
  return await apiKeyStore.delete(key);
};

import { TIER_RATE_LIMITS } from '../models/apiKey.model';

/**
 * Get tier information
 */
export const getTierInfo = (tier: ApiKeyTier) => {
  const limits = TIER_RATE_LIMITS[tier];
  return {
    tier,
    limits: {
      requestsPerDay: limits.requestsPerDay === Infinity ? 'Unlimited' : limits.requestsPerDay,
      requestsPerMinute: limits.requestsPerMinute === Infinity ? 'Unlimited' : limits.requestsPerMinute,
      requestsPerSecond: limits.requestsPerSecond === Infinity ? 'Unlimited' : limits.requestsPerSecond
    }
  };
};

/**
 * List all available tiers
 */
export const getAllTiers = (): ApiKeyTier[] => {
  return Object.values(ApiKeyTier);
};