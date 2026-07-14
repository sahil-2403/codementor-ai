import mongoose from 'mongoose';

const projectTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
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
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true }
  },
  { timestamps: true }
);

projectTaskSchema.index({ title: 'text', description: 'text', tags: 'text' });
projectTaskSchema.index({ status: 1, difficulty: 1, moduleTitle: 1 });

export const ProjectTask = mongoose.model('ProjectTask', projectTaskSchema);
