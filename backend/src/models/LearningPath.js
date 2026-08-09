import mongoose from 'mongoose';
import { COURSE_CATEGORIES, COURSE_LEVELS } from './Course.js';

const learningPathCourseSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    order: { type: Number, required: true, min: 1 },
    defaultLevel: { type: String, enum: COURSE_LEVELS, default: null },
    required: { type: Boolean, default: true }
  },
  { _id: false }
);

const learningPathSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, enum: COURSE_CATEGORIES, required: true, index: true },
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }],
    availableLevels: [{ type: String, enum: COURSE_LEVELS }],
    courses: [learningPathCourseSchema],
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true }
  },
  { timestamps: true }
);

learningPathSchema.path('availableLevels').default(() => [...COURSE_LEVELS]);
learningPathSchema.index({ status: 1, category: 1, featured: -1, order: 1, title: 1 });
learningPathSchema.index({ technologies: 1, status: 1 });
learningPathSchema.index({ 'courses.course': 1, status: 1 });
learningPathSchema.index({ title: 'text', description: 'text', slug: 'text' });

export const LearningPath = mongoose.model('LearningPath', learningPathSchema);
