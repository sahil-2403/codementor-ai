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
    order: { type: Number, default: 0 },
    durationDays: { type: Number, default: 7 },
    status: { type: String, enum: ['locked', 'available', 'in_progress', 'completed'], default: 'available' },
    lessons: [courseLessonSchema],
    quizQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' }]
  },
  { timestamps: true }
);

const coursePlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    learningGoal: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningGoal', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    roadmapType: { type: String, enum: Object.values(ROADMAP_TYPES), default: ROADMAP_TYPES.TEMPLATE },
    modules: [courseModuleSchema],
    status: { type: String, enum: Object.values(COURSE_STATUS), default: COURSE_STATUS.ACTIVE },
    aiGenerated: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    parentCoursePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'CoursePlan', default: null },
    generationJob: { type: mongoose.Schema.Types.ObjectId, ref: 'AIJob', default: undefined },
    generationKey: { type: String, default: undefined },
    generatedReason: {
      type: String,
      enum: ['initial_template', 'assessment_personalized', 'weak_topic_update', 'manual_regeneration', 'preference_adjusted'],
      default: 'initial_template'
    },
    isActive: { type: Boolean, default: true, index: true },
    generationError: { type: String, default: '' }
  },
  { timestamps: true }
);

coursePlanSchema.index({ user: 1, status: 1, isActive: 1, createdAt: -1 });
coursePlanSchema.index({ user: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
coursePlanSchema.index(
  { generationJob: 1 },
  {
    unique: true,
    name: 'course_generation_job_unique',
    partialFilterExpression: { generationJob: { $type: 'objectId' } }
  }
);
coursePlanSchema.index(
  { user: 1, generationKey: 1 },
  {
    unique: true,
    name: 'course_generation_key_unique',
    partialFilterExpression: { generationKey: { $type: 'string' } }
  }
);

export const CoursePlan = mongoose.model('CoursePlan', coursePlanSchema);
