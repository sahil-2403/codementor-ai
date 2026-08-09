import mongoose from 'mongoose';

const projectTaskSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }],
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    moduleTitle: { type: String, default: '' },
    topicOrder: { type: Number, default: 999 },
    solution: { type: String, default: '' },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner', index: true },
    relatedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    requirements: [{ type: String }],
    starterHints: [{ type: String }],
    expectedOutput: { type: String, default: '' },
    evaluationChecklist: [{ type: String }],
    tags: [{ type: String }],
    estimatedMinutes: { type: Number, default: 60 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    archivedByTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    archivedByLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    statusBeforeCascadeArchive: { type: String, enum: ['draft', 'published'], default: null },
    statusBeforeTopicArchive: { type: String, enum: ['draft', 'published'], default: null }
  },
  { timestamps: true }
);

projectTaskSchema.index({ course: 1, slug: 1 }, { unique: true });
projectTaskSchema.index({ course: 1, status: 1, difficulty: 1, moduleTitle: 1 });
projectTaskSchema.index({ technologies: 1, status: 1 });
projectTaskSchema.index({ archivedByTopics: 1, status: 1 });
projectTaskSchema.index({ archivedByLessons: 1, status: 1 });
projectTaskSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const ProjectTask = mongoose.model('ProjectTask', projectTaskSchema);
