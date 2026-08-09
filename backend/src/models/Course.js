import mongoose from 'mongoose';

export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'];
export const COURSE_CATEGORIES = [
  'fundamentals',
  'frontend',
  'backend',
  'fullstack',
  'database',
  'mobile',
  'devops',
  'data-ai',
  'interview',
  'other'
];

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, enum: COURSE_CATEGORIES, required: true, index: true },
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }],
    primaryTechnology: { type: mongoose.Schema.Types.ObjectId, ref: 'Technology', default: null },
    availableLevels: [{ type: String, enum: COURSE_LEVELS }],
    recommendedPrerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true }
  },
  { timestamps: true }
);

courseSchema.path('availableLevels').default(() => [...COURSE_LEVELS]);
courseSchema.index({ status: 1, category: 1, featured: -1, order: 1, title: 1 });
courseSchema.index({ technologies: 1, status: 1 });
courseSchema.index({ primaryTechnology: 1, status: 1 });
courseSchema.index({ title: 'text', description: 'text', slug: 'text' });

export const Course = mongoose.model('Course', courseSchema);
