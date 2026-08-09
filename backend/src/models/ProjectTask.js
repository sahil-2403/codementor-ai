import mongoose from 'mongoose';
import { Course } from './Course.js';
import { Lesson } from './Lesson.js';

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

projectTaskSchema.pre('validate', async function validateOwnership() {
  if (!this.course) return;
  const [course, lessons] = await Promise.all([
    Course.findById(this.course).select('_id status').lean(),
    this.relatedLessons?.length
      ? Lesson.find({ _id: { $in: this.relatedLessons } }).select('_id course').lean()
      : []
  ]);
  if (!course || course.status === 'archived') this.invalidate('course', 'Project must belong to an available course');
  if (lessons.length !== (this.relatedLessons || []).length) this.invalidate('relatedLessons', 'One or more related lessons do not exist');
  else if (lessons.some((lesson) => lesson.course.toString() !== this.course.toString())) {
    this.invalidate('relatedLessons', 'All related lessons must belong to the same course');
  }
});

projectTaskSchema.index({ course: 1, slug: 1 }, { unique: true });
projectTaskSchema.index({ course: 1, status: 1, difficulty: 1, moduleTitle: 1 });
projectTaskSchema.index({ technologies: 1, status: 1 });
projectTaskSchema.index({ archivedByTopics: 1, status: 1 });
projectTaskSchema.index({ archivedByLessons: 1, status: 1 });
projectTaskSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const ProjectTask = mongoose.model('ProjectTask', projectTaskSchema);
