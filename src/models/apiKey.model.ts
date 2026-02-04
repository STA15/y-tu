/**
 * API Key tier types
 */
export enum ApiKeyTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

/**
 * Rate limit configuration per tier
 */
export interface TierRateLimit {
  requestsPerDay: number;
  requestsPerMinute?: number;
  requestsPerSecond?: number;
}

/**
 * Rate limit configuration map
 */
export const TIER_RATE_LIMITS: Record<ApiKeyTier, TierRateLimit> = {
  [ApiKeyTier.FREE]: {
    requestsPerDay: 100,
    requestsPerMinute: 10
  },
  [ApiKeyTier.STARTER]: {
    requestsPerDay: 1000,
    requestsPerMinute: 50
  },
  [ApiKeyTier.PRO]: {
    requestsPerDay: 10000,
    requestsPerMinute: 200,
    requestsPerSecond: 10
  },
  [ApiKeyTier.ENTERPRISE]: {
    requestsPerDay: Infinity,
    requestsPerMinute: Infinity,
    requestsPerSecond: Infinity
  }
};

/**
 * API Key interface
 */
export interface ApiKey {
  id: string;
  key: string;
  name: string;
  tier: ApiKeyTier;
  userId?: string;
  createdAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * API Key creation request
 */
export interface CreateApiKeyRequest {
  name: string;
  tier: ApiKeyTier;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * API Key usage statistics
 */
export interface ApiKeyUsage {
  apiKeyId: string;
  date: string; // YYYY-MM-DD format
  requestCount: number;
  lastRequestAt: Date;
}
