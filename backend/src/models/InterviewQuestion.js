import mongoose from 'mongoose';

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    topic: { type: String, required: true, index: true },
    type: { type: String, enum: ['definition', 'concept', 'output', 'scenario', 'debugging', 'system_design_lite'], default: 'concept' },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner', index: true },
    expectedAnswer: { type: String, required: true },
    answerChecklist: [{ type: String }],
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true }
  },
  { timestamps: true }
);

interviewQuestionSchema.index({ question: 'text', topic: 'text', tags: 'text' });

export const InterviewQuestion = mongoose.model('InterviewQuestion', interviewQuestionSchema);
