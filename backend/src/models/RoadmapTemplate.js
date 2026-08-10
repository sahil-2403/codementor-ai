import mongoose from 'mongoose';
import { COURSE_LEVELS, Course } from './Course.js';
import { Lesson } from './Lesson.js';

const referenceId = (value) => value?._id || value;
const referenceString = (value) => String(referenceId(value) || '');

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

roadmapTemplateSchema.pre('validate', async function validateOwnership() {
  const courseId = referenceId(this.course);
  if (!courseId) return;
  const course = await Course.findById(courseId).select('_id status availableLevels').lean();
  if (!course || course.status === 'archived') {
    this.invalidate('course', 'Roadmap template must belong to an available course');
    return;
  }
  if (this.level && !(course.availableLevels || []).includes(this.level)) {
    this.invalidate('level', 'Template level must be supported by the selected course');
  }

  const lessonIds = (this.modules || []).flatMap((module) => (module.lessons || []).map(referenceId)).filter(Boolean);
  if (!lessonIds.length) return;
  const lessons = await Lesson.find({ _id: { $in: lessonIds } }).select('_id course').lean();
  const uniqueLessonIds = new Set(lessonIds.map(String));
  if (lessons.length !== uniqueLessonIds.size) {
    this.invalidate('modules', 'One or more template lessons do not exist');
  } else if (lessons.some((lesson) => referenceString(lesson.course) !== referenceString(courseId))) {
    this.invalidate('modules', 'All template lessons must belong to the selected course');
  }
});

roadmapTemplateSchema.index({ course: 1, level: 1 }, { unique: true });
roadmapTemplateSchema.index({ course: 1, level: 1, status: 1 });
roadmapTemplateSchema.index({ title: 'text', description: 'text' });

export const RoadmapTemplate = mongoose.model('RoadmapTemplate', roadmapTemplateSchema);
