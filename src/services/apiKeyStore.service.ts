import { ApiKey, ApiKeyTier, CreateApiKeyRequest, ApiKeyUsage, TIER_RATE_LIMITS } from '../models/apiKey.model';
import { ApiKeyModel } from '../models/apiKey.model.mongoose';
import { UsageModel } from '../models/usage.model.mongoose';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { database } from '../config/database';

/**
 * MongoDB-based API key store
 */
class ApiKeyStore {
  private initializationPromise: Promise<void> | null = null;

  /**
   * Ensure database connection before operations
   */
  private async ensureConnection(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = database.connect();
    }
    await this.initializationPromise;
  }

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    const buffer = crypto.randomBytes(32);
    return buffer.toString('base64url');
  }

  /**
   * Create a new API key
   */
  async create(request: CreateApiKeyRequest): Promise<ApiKey> {
    await this.ensureConnection();

    const key = `ytu_${this.generateApiKey()}`;

    const apiKeyDoc = new ApiKeyModel({
      key,
      name: request.name,
      tier: request.tier,
      userId: request.userId,
      isActive: true,
      metadata: request.metadata || {}
    });

    await apiKeyDoc.save();

    logger.info(`Created API key: ${apiKeyDoc._id.toString()} (${request.tier})`);

    return {
      id: apiKeyDoc._id.toString(),
      key: apiKeyDoc.key,
      name: apiKeyDoc.name,
      tier: apiKeyDoc.tier,
      userId: apiKeyDoc.userId,
      createdAt: apiKeyDoc.createdAt,
      isActive: apiKeyDoc.isActive,
      lastUsedAt: apiKeyDoc.lastUsedAt,
      metadata: apiKeyDoc.metadata
    };
  }

  /**
   * Find API key by key string
   */
  async findByKey(key: string): Promise<ApiKey | null> {
    await this.ensureConnection();

    // TEMPORARY DEBUG
    logger.info('Finding API key', { 
      searchKey: key, 
      keyLength: key.length 
    });

    const apiKeyDoc = await ApiKeyModel.findOne({ key, isActive: true });
    
    // TEMPORARY DEBUG
    logger.info('Query result', { 
      found: !!apiKeyDoc,
      docKey: apiKeyDoc?.key,
      docId: apiKeyDoc?._id?.toString()
    });

    if (!apiKeyDoc) {
      return null;
    }

    return {
      id: apiKeyDoc._id.toString(),
      key: apiKeyDoc.key,
      name: apiKeyDoc.name,
      tier: apiKeyDoc.tier,
      userId: apiKeyDoc.userId,
      createdAt: apiKeyDoc.createdAt,
      isActive: apiKeyDoc.isActive,
      lastUsedAt: apiKeyDoc.lastUsedAt,
      metadata: apiKeyDoc.metadata
    };
  }

  /**
   * Find API key by ID
   */
  async findById(id: string): Promise<ApiKey | null> {
    await this.ensureConnection();

    const apiKeyDoc = await ApiKeyModel.findOne({ _id: id, isActive: true });
    if (!apiKeyDoc) {
      return null;
    }

    return {
      id: apiKeyDoc._id.toString(),
      key: apiKeyDoc.key,
      name: apiKeyDoc.name,
      tier: apiKeyDoc.tier,
      userId: apiKeyDoc.userId,
      createdAt: apiKeyDoc.createdAt,
      isActive: apiKeyDoc.isActive,
      lastUsedAt: apiKeyDoc.lastUsedAt,
      metadata: apiKeyDoc.metadata
    };
  }

  /**
   * Get all API keys for a user
   */
  async findByUserId(userId: string): Promise<ApiKey[]> {
    await this.ensureConnection();

    const apiKeyDocs = await ApiKeyModel.find({ userId, isActive: true });
    
    return apiKeyDocs.map(doc => ({
      id: doc._id.toString(),
      key: doc.key,
      name: doc.name,
      tier: doc.tier,
      userId: doc.userId,
      createdAt: doc.createdAt,
      isActive: doc.isActive,
      lastUsedAt: doc.lastUsedAt,
      metadata: doc.metadata
    }));
  }

  /**
   * Update API key
   */
  async update(key: string, updates: Partial<ApiKey>): Promise<ApiKey | null> {
    await this.ensureConnection();

    const apiKeyDoc = await ApiKeyModel.findOneAndUpdate(
      { key },
      { $set: updates },
      { new: true }
    );

    if (!apiKeyDoc) {
      return null;
    }

    return {
      id: apiKeyDoc._id.toString(),
      key: apiKeyDoc.key,
      name: apiKeyDoc.name,
      tier: apiKeyDoc.tier,
      userId: apiKeyDoc.userId,
      createdAt: apiKeyDoc.createdAt,
      isActive: apiKeyDoc.isActive,
      lastUsedAt: apiKeyDoc.lastUsedAt,
      metadata: apiKeyDoc.metadata
    };
  }

  /**
   * Deactivate API key
   */
  async deactivate(key: string): Promise<boolean> {
    await this.ensureConnection();

    const result = await ApiKeyModel.updateOne(
      { key },
      { $set: { isActive: false } }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Deactivated API key: ${key}`);
      return true;
    }
    return false;
  }

  /**
   * Delete API key
   */
  async delete(key: string): Promise<boolean> {
    await this.ensureConnection();

    const apiKeyDoc = await ApiKeyModel.findOne({ key });
    if (!apiKeyDoc) {
      return false;
    }

    await ApiKeyModel.deleteOne({ key });
    await UsageModel.deleteMany({ apiKeyId: apiKeyDoc._id.toString() });

    logger.info(`Deleted API key: ${key}`);
    return true;
  }

  /**
   * Record API key usage
   */
  async recordUsage(apiKeyId: string): Promise<void> {
    await this.ensureConnection();

    const today = new Date().toISOString().split('T')[0];

    await UsageModel.findOneAndUpdate(
      { apiKeyId, date: today },
      {
        $inc: { requestCount: 1 },
        $set: { lastRequestAt: new Date() }
      },
      { upsert: true }
    );

    // Update lastUsedAt on the API key
    await ApiKeyModel.updateOne(
      { _id: apiKeyId },
      { $set: { lastUsedAt: new Date() } }
    );
  }

  /**
   * Get usage statistics for an API key
   */
  async getUsage(apiKeyId: string, date?: string): Promise<ApiKeyUsage | null> {
    await this.ensureConnection();

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const usage = await UsageModel.findOne({ apiKeyId, date: targetDate });
    
    if (!usage) {
      return null;
    }

    return {
      apiKeyId: usage.apiKeyId,
      date: usage.date,
      requestCount: usage.requestCount,
      lastRequestAt: usage.lastRequestAt
    };
  }

  /**
   * Get daily request count for an API key
   */
  async getDailyRequestCount(apiKeyId: string): Promise<number> {
    const usage = await this.getUsage(apiKeyId);
    return usage ? usage.requestCount : 0;
  }

  /**
   * Check if API key has exceeded daily limit
   */
  async hasExceededDailyLimit(apiKey: ApiKey): Promise<boolean> {
    if (apiKey.tier === ApiKeyTier.ENTERPRISE) {
      return false; // Unlimited
    }

    const dailyCount = await this.getDailyRequestCount(apiKey.id);
    const limit = TIER_RATE_LIMITS[apiKey.tier].requestsPerDay;

    return dailyCount >= limit;
  }

  /**
   * Clean up old usage data (older than 90 days)
   */
  async cleanupOldUsage(): Promise<void> {
    await this.ensureConnection();

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];

    const result = await UsageModel.deleteMany({
      date: { $lt: cutoffDate }
    });

    if (result.deletedCount > 0) {
      logger.info(`Cleaned up ${result.deletedCount} old usage records`);
    }
  }

  /**
   * Initialize with sample API keys for development
   */
  async initializeSampleKeys(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    await this.ensureConnection();

    // Check if sample keys already exist
    const existingKeys = await ApiKeyModel.countDocuments({
      name: { $regex: /^Development.*Key$/ }
    });

    if (existingKeys > 0) {
      logger.info('Sample API keys already exist');
      return;
    }

    // Create sample keys for each tier
    await this.create({
      name: 'Development FREE Key',
      tier: ApiKeyTier.FREE
    });

    await this.create({
      name: 'Development STARTER Key',
      tier: ApiKeyTier.STARTER
    });

    await this.create({
      name: 'Development PRO Key',
      tier: ApiKeyTier.PRO
    });

    logger.info('Initialized sample API keys for development');
  }
}

// Singleton instance
export const apiKeyStore = new ApiKeyStore();

// Initialize sample keys in development
if (process.env.NODE_ENV === 'development') {
  apiKeyStore.initializeSampleKeys().catch(err => {
    logger.error('Failed to initialize sample keys', { error: err });
  });
}

// Cleanup old usage data daily
setInterval(() => {
  apiKeyStore.cleanupOldUsage().catch(err => {
    logger.error('Failed to cleanup old usage data', { error: err });
  });
}, 24 * 60 * 60 * 1000); // Every 24 hours