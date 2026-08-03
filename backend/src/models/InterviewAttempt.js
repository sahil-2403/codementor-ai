import mongoose from 'mongoose';

const interviewAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewQuestion', required: true, index: true },
    attemptNumber: { type: Number, enum: [1, 2], default: null },
    answer: { type: String, required: true },
    status: {
      type: String,
      enum: ['submitted', 'reviewing', 'reviewed', 'review_unavailable'],
      default: 'submitted',
      index: true
    },
    feedbackMode: { type: String, enum: ['ai', 'fallback', 'none'], default: 'none' },
    reviewAttempts: { type: Number, default: 0 },
    reviewRequestedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewErrorCode: { type: String, default: '' },
    score: { type: Number, default: null },
    aiFeedback: {
      summary: { type: String, default: '' },
      expectedAnswer: { type: String, default: '' },
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      weakTopicsDetected: [{ topic: String, score: Number }],
      generatedAt: Date
    }
  },
  { timestamps: true }
);

interviewAttemptSchema.index({ user: 1, createdAt: -1 });
interviewAttemptSchema.index({ user: 1, question: 1, createdAt: -1 });

export const InterviewAttempt = mongoose.model('InterviewAttempt', interviewAttemptSchema);
