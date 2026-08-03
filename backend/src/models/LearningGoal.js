import mongoose from 'mongoose';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';

const learningGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalKey: { type: String, required: true, default: 'junior-mern-stack' },
    goalTitle: { type: String, required: true, default: 'Junior MERN Stack Developer' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: null },
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
    status: { type: String, enum: ['draft', 'active', 'completed', 'archived'], default: 'draft' }
  },
  { timestamps: true }
);

learningGoalSchema.index({ user: 1, status: 1, createdAt: -1 });
learningGoalSchema.index({ user: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

export const LearningGoal = mongoose.model('LearningGoal', learningGoalSchema);
