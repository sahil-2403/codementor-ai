import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }],
    question: { type: String, required: true },
    bank: { type: String, enum: ['quiz', 'skill_check'], required: true, default: 'quiz', index: true },
    type: { type: String, enum: ['mcq', 'code_output', 'short_answer'], default: 'mcq' },
    codeSnippet: { type: String, default: '' },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    relatedLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    manualArchive: { type: Boolean, default: false },
    statusBeforeManualArchive: { type: String, enum: ['draft', 'published'], default: null },
    archivedByTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    archivedByLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    statusBeforeCascadeArchive: { type: String, enum: ['draft', 'published'], default: null }
  },
  { timestamps: true }
);

quizQuestionSchema.index({ course: 1, bank: 1, status: 1, difficulty: 1, topic: 1, type: 1 });
quizQuestionSchema.index({ technologies: 1, status: 1 });
quizQuestionSchema.index({ archivedByTopics: 1, status: 1 });
quizQuestionSchema.index({ archivedByLessons: 1, status: 1 });
quizQuestionSchema.index({ course: 1, tags: 1, bank: 1, status: 1 });
quizQuestionSchema.index({ question: 'text', explanation: 'text', tags: 'text' });

export const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);
