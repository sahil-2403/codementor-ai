import mongoose from 'mongoose';
import { Course } from './Course.js';
import { Lesson } from './Lesson.js';

const referenceId = (value) => value?._id || value;
const referenceString = (value) => String(referenceId(value) || '');

const practiceTaskSchema = new mongoose.Schema(
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
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true }
  },
  { timestamps: true }
);

practiceTaskSchema.pre('validate', async function validateOwnership() {
  const courseId = referenceId(this.course);
  const lessonIds = (this.relatedLessons || []).map(referenceId).filter(Boolean);
  if (!courseId) return;

  const [course, lessons] = await Promise.all([
    Course.findById(courseId).select('_id status').lean(),
    lessonIds.length ? Lesson.find({ _id: { $in: lessonIds } }).select('_id course').lean() : []
  ]);

  if (!course || course.status === 'archived') this.invalidate('course', 'Practice task must belong to an available course');
  if (lessons.length !== new Set(lessonIds.map(String)).size) this.invalidate('relatedLessons', 'One or more related lessons do not exist');
  else if (lessons.some((lesson) => referenceString(lesson.course) !== referenceString(courseId))) {
    this.invalidate('relatedLessons', 'All related lessons must belong to the same course');
  }
});

practiceTaskSchema.index({ course: 1, slug: 1 }, { unique: true });
practiceTaskSchema.index({ course: 1, status: 1, difficulty: 1, moduleTitle: 1 });
practiceTaskSchema.index({ technologies: 1, status: 1 });
practiceTaskSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const PracticeTask = mongoose.model('PracticeTask', practiceTaskSchema);
