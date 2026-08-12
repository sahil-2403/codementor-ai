import mongoose from 'mongoose';
import { AI_FEATURES } from '../constants/aiFeatures.js';

const aiUsageLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feature: { type: String, enum: Object.values(AI_FEATURES), required: true, index: true },
    status: { type: String, enum: ['success', 'failed'], default: 'success', index: true },
    model: { type: String, default: '' },
    errorMessage: { type: String, default: '' }
  },
  { timestamps: true }
);

aiUsageLogSchema.index({ user: 1, feature: 1, createdAt: -1 });
aiUsageLogSchema.index({ feature: 1, status: 1, createdAt: -1 });

export const AIUsageLog = mongoose.model('AIUsageLog', aiUsageLogSchema);
