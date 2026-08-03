import mongoose from 'mongoose';

const checklistFeedbackSchema = new mongoose.Schema(
  {
    item: String,
    passed: { type: Boolean, default: false },
    feedback: String
  },
  { _id: false }
);

const projectSubmissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectTask: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectTask', required: true, index: true },
    attemptNumber: { type: Number, enum: [1, 2], default: null },
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

projectSubmissionSchema.index({ user: 1, projectTask: 1, createdAt: -1 });

export const ProjectSubmission = mongoose.model('ProjectSubmission', projectSubmissionSchema);
