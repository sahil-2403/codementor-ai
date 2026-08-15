import mongoose from 'mongoose';

const checklistFeedbackSchema = new mongoose.Schema(
  {
    item: String,
    passed: { type: Boolean, default: false },
    feedback: String
  },
  { _id: false }
);

const practiceSubmissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    practiceTask: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeTask', required: true, index: true },
    attemptNumber: { type: Number, enum: [1, 2], required: true },
    submittedCode: { type: String, default: '' },
    submittedExplanation: { type: String, default: '' },
    status: {
      type: String,
      enum: ['submitted', 'reviewing', 'reviewed', 'review_unavailable'],
      default: 'submitted',
      index: true
    },
    reviewMode: { type: String, enum: ['ai', 'fallback', 'none'], default: 'none' },
    reviewAttempts: { type: Number, default: 0 },
    reviewRequestedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewErrorCode: { type: String, default: '' },
    score: { type: Number, default: null },
    aiFeedback: {
      summary: { type: String, default: '' },
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      checklist: [checklistFeedbackSchema],
      weakTopicsDetected: [{ topic: String, score: Number }],
      generatedAt: Date
    }
  },
  { timestamps: true }
);

practiceSubmissionSchema.index({ user: 1, practiceTask: 1, createdAt: -1 });

export const PracticeSubmission = mongoose.model('PracticeSubmission', practiceSubmissionSchema);
