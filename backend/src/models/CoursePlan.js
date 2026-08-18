import mongoose from 'mongoose';
import { COURSE_STATUS, ROADMAP_TYPES } from '../constants/roadmapTypes.js';

const courseLessonSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    status: { type: String, enum: ['locked', 'available', 'completed'], default: 'available' },
    order: { type: Number, default: 0 }
  },
  { _id: false }
);

const courseModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: null },
    order: { type: Number, default: 0 },
    durationDays: { type: Number, default: 7 },
    highPriority: { type: Boolean, default: false },
    status: { type: String, enum: ['locked', 'available', 'in_progress', 'completed'], default: 'available' },
    lessons: [courseLessonSchema],
    quizQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' }]
  },
  { timestamps: true }
);

const coursePlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    learningPath: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', default: null, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    roadmapType: {
      type: String,
      enum: [...Object.values(ROADMAP_TYPES), 'template_ai_adjusted'],
      default: ROADMAP_TYPES.TEMPLATE
    },
    modules: [courseModuleSchema],
    status: { type: String, enum: Object.values(COURSE_STATUS), default: COURSE_STATUS.ACTIVE },
    aiGenerated: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    parentCoursePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'CoursePlan', default: null },
    generatedReason: {
      type: String,
      enum: ['initial_template', 'assessment_personalized', 'weak_topic_update', 'manual_regeneration', 'preference_adjusted'],
      default: 'initial_template'
    },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

coursePlanSchema.index({ user: 1, status: 1, createdAt: -1 });
coursePlanSchema.index({ enrollment: 1, status: 1, isActive: 1, createdAt: -1 });

export const CoursePlan = mongoose.model('CoursePlan', coursePlanSchema);
