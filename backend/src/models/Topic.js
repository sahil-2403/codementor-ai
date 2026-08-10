import mongoose from 'mongoose';
import { Course } from './Course.js';

const referenceId = (value) => value?._id || value;

const topicSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }],
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    tags: [{ type: String }],
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true
    },
    statusBeforeCourseArchive: { type: String, enum: ['active'], default: null }
  },
  { timestamps: true }
);

topicSchema.pre('validate', async function validateCourse() {
  const courseId = referenceId(this.course);
  if (!courseId) return;
  const course = await Course.findById(courseId).select('_id status').lean();
  if (!course || course.status === 'archived') {
    this.invalidate('course', 'Topic must belong to an available course');
  }
});

topicSchema.index({ course: 1, slug: 1 }, { unique: true });
topicSchema.index({ course: 1, status: 1, category: 1, difficulty: 1, order: 1 });
topicSchema.index({ technologies: 1, status: 1 });
topicSchema.index({ title: 'text', category: 'text', tags: 'text' });

export const Topic = mongoose.model('Topic', topicSchema);
