import mongoose from 'mongoose';

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: String,
    answer: String
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }],
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    theory: { type: String, required: true },
    codeExample: { type: String, default: '' },
    codeExplanation: { type: String, default: '' },
    commonMistakes: [{ type: String }],
    interviewDefinition: { type: String, default: '' },
    interviewQuestions: [interviewQuestionSchema],
    practiceTask: { type: String, default: '' },
    tags: [{ type: String }],
    estimatedMinutes: { type: Number, default: 45 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    manualArchive: { type: Boolean, default: false },
    archivedByTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    statusBeforeCascadeArchive: { type: String, enum: ['draft', 'published'], default: null },
    statusBeforeTopicArchive: { type: String, enum: ['draft', 'published'], default: null }
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, slug: 1 }, { unique: true });
lessonSchema.index({ course: 1, status: 1, difficulty: 1, topic: 1, createdAt: -1 });
lessonSchema.index({ technologies: 1, status: 1 });
lessonSchema.index({ archivedByTopics: 1, status: 1 });
lessonSchema.index({ title: 'text', theory: 'text', tags: 'text' });

export const Lesson = mongoose.model('Lesson', lessonSchema);
