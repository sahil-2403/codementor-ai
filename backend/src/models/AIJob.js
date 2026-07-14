import mongoose from 'mongoose';

const aiJobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
    input: { type: mongoose.Schema.Types.Mixed, default: {} },
    output: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: { type: String, default: '' },
    attempts: { type: Number, default: 0 },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

aiJobSchema.index({ user: 1, status: 1, createdAt: -1 });
aiJobSchema.index({ type: 1, status: 1, createdAt: -1 });

export const AIJob = mongoose.model('AIJob', aiJobSchema);
