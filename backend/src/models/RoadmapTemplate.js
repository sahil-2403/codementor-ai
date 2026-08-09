import mongoose from 'mongoose';
import { COURSE_LEVELS } from './Course.js';

const templateModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    durationDays: { type: Number, default: 7 },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    quizTags: [{ type: String, trim: true }]
  },
  { _id: false }
);

const roadmapTemplateSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    level: { type: String, enum: COURSE_LEVELS, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    modules: [templateModuleSchema],
    estimatedDurationDays: { type: Number, default: 90 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true }
  },
  { timestamps: true }
);

roadmapTemplateSchema.index({ course: 1, level: 1 }, { unique: true });
roadmapTemplateSchema.index({ course: 1, level: 1, status: 1 });
roadmapTemplateSchema.index({ title: 'text', description: 'text' });

export const RoadmapTemplate = mongoose.model('RoadmapTemplate', roadmapTemplateSchema);
