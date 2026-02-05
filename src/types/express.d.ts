import { ApiKeyTier } from '../models/apiKey.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        [key: string]: any;
        id: string;
        email?: string;
        tier?: ApiKeyTier | string;
        apiKey?: string;
        apiKeyId?: string;
        apiKeyName?: string;
        rapidapiUser?: string;
        rapidapiSubscription?: string;
      };
      apiKey?: {
        id: string;
        key: string;
        name: string;
        tier: ApiKeyTier;
        userId?: string;
        createdAt: Date;
        lastUsedAt?: Date;
        isActive: boolean;
        metadata?: Record<string, any>;
      };
      rapidapi?: {
        user?: string;
        subscription?: string;
        tier: ApiKeyTier;
      };
    }
  }
}

export {};