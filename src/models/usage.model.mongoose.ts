import mongoose, { Schema, Document } from 'mongoose';

export interface IUsageDocument extends Document {
  apiKeyId: string;
  date: string; // YYYY-MM-DD format
  requestCount: number;
  lastRequestAt: Date;
}

const UsageSchema = new Schema<IUsageDocument>({
  apiKeyId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true
  },
  requestCount: {
    type: Number,
    default: 0
  },
  lastRequestAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'usage'
});

// Compound index for efficient daily usage queries
UsageSchema.index({ apiKeyId: 1, date: 1 }, { unique: true });

export const UsageModel = mongoose.model<IUsageDocument>('Usage', UsageSchema);
