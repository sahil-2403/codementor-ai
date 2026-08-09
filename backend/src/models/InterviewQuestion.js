import mongoose from 'mongoose';

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    topic: { type: String, required: true, index: true },
    topicRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true },
    type: { type: String, enum: ['definition', 'concept', 'output', 'scenario', 'debugging', 'system_design_lite'], default: 'concept' },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner', index: true },
    expectedAnswer: { type: String, required: true },
    answerChecklist: [{ type: String }],
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
    manualArchive: { type: Boolean, default: false },
    statusBeforeManualArchive: { type: String, enum: ['draft', 'published'], default: null },
    archivedByTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    statusBeforeCascadeArchive: { type: String, enum: ['draft', 'published'], default: null },
    statusBeforeTopicArchive: { type: String, enum: ['draft', 'published'], default: null }
  },
  { timestamps: true }
);

interviewQuestionSchema.index({ question: 'text', topic: 'text', tags: 'text' });
interviewQuestionSchema.index({ archivedByTopics: 1, status: 1 });

export const InterviewQuestion = mongoose.model('InterviewQuestion', interviewQuestionSchema);
