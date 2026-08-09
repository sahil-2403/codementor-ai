import mongoose from 'mongoose';
import { COURSE_LEVELS } from './Course.js';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['course', 'learning_path'], required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    learningPath: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', default: null },
    level: { type: String, enum: COURSE_LEVELS, default: null },
    currentCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    dailyStudyTime: { type: Number, default: 90 },
    targetDurationDays: { type: Number, default: 90 },
    learningStyle: { type: String, default: 'project-based' },
    knownBasics: [{ type: String }],
    mainFocus: { type: String, default: 'job-preparation' },
    assessmentPreference: { type: String, enum: ['not_applicable', 'take', 'skip'], default: 'not_applicable' },
    onboardingState: {
      type: String,
      enum: Object.values(ONBOARDING_STATES),
      default: ONBOARDING_STATES.LEVEL_PENDING,
      index: true
    },
    preferencesCompletedAt: { type: Date, default: null },
    assessmentChoiceAt: { type: Date, default: null },
    roadmapJob: { type: mongoose.Schema.Types.ObjectId, ref: 'AIJob', default: null },
    onboardingErrorCode: { type: String, default: '' },
    onboardingErrorMessage: { type: String, default: '' },
    onboardingCompletedAt: { type: Date, default: null },
    status: { type: String, enum: ['draft', 'active', 'completed', 'archived'], default: 'draft', index: true }
  },
  { timestamps: true }
);

enrollmentSchema.pre('validate', function validateTarget(next) {
  const hasCourse = Boolean(this.course);
  const hasPath = Boolean(this.learningPath);
  if (this.type === 'course' && (!hasCourse || hasPath)) {
    return next(new Error('Course enrollment requires exactly one course target'));
  }
  if (this.type === 'learning_path' && (!hasPath || hasCourse)) {
    return next(new Error('Learning path enrollment requires exactly one learning path target'));
  }
  return next();
});

enrollmentSchema.index({ user: 1, status: 1, updatedAt: -1 });
enrollmentSchema.index({ user: 1, course: 1, status: 1 });
enrollmentSchema.index({ user: 1, learningPath: 1, status: 1 });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
