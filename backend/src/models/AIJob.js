import mongoose from 'mongoose';

const aiJobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
    input: { type: mongoose.Schema.Types.Mixed, default: {} },
    output: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: { type: String, default: '' },
    errorCode: { type: String, default: '' },
    attempts: { type: Number, default: 0 },
    idempotencyKey: { type: String, default: undefined },
    lockKey: { type: String, default: undefined },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

aiJobSchema.index({ user: 1, status: 1, createdAt: -1 });
aiJobSchema.index({ type: 1, status: 1, createdAt: -1 });
aiJobSchema.index(
  { user: 1, type: 1, idempotencyKey: 1 },
  {
    unique: true,
    name: 'ai_job_idempotency_unique',
    partialFilterExpression: { idempotencyKey: { $type: 'string' } }
  }
);
aiJobSchema.index(
  { user: 1, lockKey: 1 },
  {
    unique: true,
    name: 'ai_job_active_lock_unique',
    partialFilterExpression: { lockKey: { $type: 'string' } }
  }
);

export const AIJob = mongoose.model('AIJob', aiJobSchema);
