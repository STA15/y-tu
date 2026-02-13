import mongoose, { Schema, Document } from 'mongoose';
import { ApiKeyTier } from './apiKey.model';

export interface IApiKeyDocument extends Document {
  key: string;
  name: string;
  tier: ApiKeyTier;
  userId?: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  metadata: Record<string, any>;
}

const ApiKeySchema = new Schema<IApiKeyDocument>({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  tier: {
    type: String,
    enum: Object.values(ApiKeyTier),
    required: true,
    default: ApiKeyTier.FREE
  },
  userId: {
    type: String,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'api_keys'
});

// Index for efficient queries
ApiKeySchema.index({ key: 1, isActive: 1 });
ApiKeySchema.index({ userId: 1, isActive: 1 });

export const ApiKeyModel = mongoose.model<IApiKeyDocument>('ApiKey', ApiKeySchema);