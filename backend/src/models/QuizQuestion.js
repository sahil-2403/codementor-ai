import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'code_output', 'short_answer'], default: 'mcq' },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    relatedLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
    archivedByTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    archivedByLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    statusBeforeCascadeArchive: { type: String, enum: ['draft', 'published'], default: null },
    statusBeforeTopicArchive: { type: String, enum: ['draft', 'published'], default: null }
  },
  { timestamps: true }
);

quizQuestionSchema.index({ status: 1, difficulty: 1, topic: 1, type: 1 });
quizQuestionSchema.index({ archivedByTopics: 1, archivedByLessons: 1, status: 1 });
quizQuestionSchema.index({ tags: 1, status: 1 });
quizQuestionSchema.index({ question: 'text', explanation: 'text', tags: 'text' });

export const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);
