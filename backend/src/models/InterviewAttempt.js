import mongoose from 'mongoose';

const interviewAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewQuestion', required: true, index: true },
    answer: { type: String, required: true },
    feedbackMode: { type: String, enum: ['ai', 'fallback'], default: 'ai' },
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

export const InterviewAttempt = mongoose.model('InterviewAttempt', interviewAttemptSchema);
