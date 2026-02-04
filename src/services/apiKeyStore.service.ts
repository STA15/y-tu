import { ApiKey, ApiKeyTier, CreateApiKeyRequest, ApiKeyUsage, TIER_RATE_LIMITS } from '../models/apiKey.model';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * In-memory API key store
 * TODO: Migrate to database (PostgreSQL, MongoDB, etc.)
 */
class ApiKeyStore {
  private keys: Map<string, ApiKey> = new Map();
  private usage: Map<string, Map<string, ApiKeyUsage>> = new Map(); // apiKeyId -> date -> usage

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    // Generate a 32-byte random key and encode as base64url
    const buffer = crypto.randomBytes(32);
    return buffer.toString('base64url');
  }

  /**
   * Create a new API key
   */
  create(request: CreateApiKeyRequest): ApiKey {
    const id = `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const key = `ytu_${this.generateApiKey()}`;
    
    const apiKey: ApiKey = {
      id,
      key,
      name: request.name,
      tier: request.tier,
      userId: request.userId,
      createdAt: new Date(),
      isActive: true,
      metadata: request.metadata || {}
    };

    this.keys.set(key, apiKey);
    logger.info(`Created API key: ${id} (${request.tier})`);
    
    return apiKey;
  }

  /**
   * Find API key by key string
   */
  findByKey(key: string): ApiKey | null {
    const apiKey = this.keys.get(key);
    if (!apiKey || !apiKey.isActive) {
      return null;
    }
    return apiKey;
  }

  /**
   * Find API key by ID
   */
  findById(id: string): ApiKey | null {
    for (const apiKey of this.keys.values()) {
      if (apiKey.id === id && apiKey.isActive) {
        return apiKey;
      }
    }
    return null;
  }

  /**
   * Get all API keys for a user
   */
  findByUserId(userId: string): ApiKey[] {
    return Array.from(this.keys.values()).filter(
      key => key.userId === userId && key.isActive
    );
  }

  /**
   * Update API key
   */
  update(key: string, updates: Partial<ApiKey>): ApiKey | null {
    const apiKey = this.keys.get(key);
    if (!apiKey) {
      return null;
    }

    const updated = { ...apiKey, ...updates };
    this.keys.set(key, updated);
    return updated;
  }

  /**
   * Deactivate API key
   */
  deactivate(key: string): boolean {
    const apiKey = this.keys.get(key);
    if (!apiKey) {
      return false;
    }

    apiKey.isActive = false;
    this.keys.set(key, apiKey);
    logger.info(`Deactivated API key: ${apiKey.id}`);
    return true;
  }

  /**
   * Delete API key
   */
  delete(key: string): boolean {
    const deleted = this.keys.delete(key);
    if (deleted) {
      // Also remove usage data
      const apiKey = Array.from(this.keys.values()).find(k => k.key === key);
      if (apiKey) {
        this.usage.delete(apiKey.id);
      }
      logger.info(`Deleted API key: ${key}`);
    }
    return deleted;
  }

  /**
   * Record API key usage
   */
  recordUsage(apiKeyId: string): void {
    const today = new Date().toISOString().split('T')[0];
    
    if (!this.usage.has(apiKeyId)) {
      this.usage.set(apiKeyId, new Map());
    }

    const dailyUsage = this.usage.get(apiKeyId)!;
    
    if (!dailyUsage.has(today)) {
      dailyUsage.set(today, {
        apiKeyId,
        date: today,
        requestCount: 0,
        lastRequestAt: new Date()
      });
    }

    const usage = dailyUsage.get(today)!;
    usage.requestCount++;
    usage.lastRequestAt = new Date();

    // Update lastUsedAt on the API key
    const apiKey = Array.from(this.keys.values()).find(k => k.id === apiKeyId);
    if (apiKey) {
      apiKey.lastUsedAt = new Date();
    }
  }

  /**
   * Get usage statistics for an API key
   */
  getUsage(apiKeyId: string, date?: string): ApiKeyUsage | null {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dailyUsage = this.usage.get(apiKeyId);
    
    if (!dailyUsage) {
      return null;
    }

    return dailyUsage.get(targetDate) || null;
  }

  /**
   * Get daily request count for an API key
   */
  getDailyRequestCount(apiKeyId: string): number {
    const usage = this.getUsage(apiKeyId);
    return usage ? usage.requestCount : 0;
  }

  /**
   * Check if API key has exceeded daily limit
   */
  hasExceededDailyLimit(apiKey: ApiKey): boolean {
    if (apiKey.tier === ApiKeyTier.ENTERPRISE) {
      return false; // Unlimited
    }

    const dailyCount = this.getDailyRequestCount(apiKey.id);
    const limit = TIER_RATE_LIMITS[apiKey.tier].requestsPerDay;
    
    return dailyCount >= limit;
  }

  /**
   * Clean up old usage data (older than 30 days)
   */
  cleanupOldUsage(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const [apiKeyId, dailyUsage] of this.usage.entries()) {
      for (const [date, usage] of dailyUsage.entries()) {
        const usageDate = new Date(date);
        if (usageDate < thirtyDaysAgo) {
          dailyUsage.delete(date);
        }
      }

      // Remove empty usage maps
      if (dailyUsage.size === 0) {
        this.usage.delete(apiKeyId);
      }
    }
  }

  /**
   * Initialize with sample API keys for development
   */
  initializeSampleKeys(): void {
    if (process.env.NODE_ENV === 'development') {
      // Sample FREE tier key
      this.create({
        name: 'Development FREE Key',
        tier: ApiKeyTier.FREE
      });

      // Sample STARTER tier key
      this.create({
        name: 'Development STARTER Key',
        tier: ApiKeyTier.STARTER
      });

      // Sample PRO tier key
      this.create({
        name: 'Development PRO Key',
        tier: ApiKeyTier.PRO
      });

      logger.info('Initialized sample API keys for development');
    }
  }
}

// Singleton instance
export const apiKeyStore = new ApiKeyStore();

// Initialize sample keys in development
if (process.env.NODE_ENV === 'development') {
  apiKeyStore.initializeSampleKeys();
}

// Cleanup old usage data daily
setInterval(() => {
  apiKeyStore.cleanupOldUsage();
}, 24 * 60 * 60 * 1000); // Every 24 hours