import mongoose from 'mongoose';
import { AI_FEATURES } from '../constants/aiFeatures.js';

const aiUsageLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feature: { type: String, enum: Object.values(AI_FEATURES), required: true, index: true },
    model: { type: String, default: 'mock' },
    provider: { type: String, default: 'mock' },
    status: { type: String, enum: ['success', 'failed', 'blocked'], default: 'success', index: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    promptFingerprint: { type: String, default: '' },
    contextSourceCount: { type: Number, default: 0 },
    contextSources: [
      {
        type: { type: String, default: 'lesson' },
        title: String,
        refId: String
      }
    ],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    errorMessage: { type: String, default: '' }
  },
  { timestamps: true }
);

aiUsageLogSchema.index({ user: 1, feature: 1, createdAt: -1 });
aiUsageLogSchema.index({ feature: 1, status: 1, createdAt: -1 });
aiUsageLogSchema.index({ provider: 1, model: 1, createdAt: -1 });

export const AIUsageLog = mongoose.model('AIUsageLog', aiUsageLogSchema);
