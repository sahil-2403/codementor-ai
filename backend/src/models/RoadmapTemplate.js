import mongoose from 'mongoose';

const templateModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    durationDays: { type: Number, default: 7 },
    lessonSlugs: [{ type: String }],
    quizTags: [{ type: String }]
  },
  { _id: false }
);

const roadmapTemplateSchema = new mongoose.Schema(
  {
    goalKey: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    modules: [templateModuleSchema],
    estimatedDurationDays: { type: Number, default: 90 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' }
  },
  { timestamps: true }
);

roadmapTemplateSchema.index({ goalKey: 1, level: 1 }, { unique: true });
roadmapTemplateSchema.index({ goalKey: 1, level: 1, status: 1 });
roadmapTemplateSchema.index({ title: 'text', description: 'text', goalKey: 'text' });

export const RoadmapTemplate = mongoose.model('RoadmapTemplate', roadmapTemplateSchema);
