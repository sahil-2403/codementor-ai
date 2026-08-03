import { LearningGoal } from '../models/LearningGoal.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Assessment } from '../models/Assessment.js';
import { AIJob } from '../models/AIJob.js';
import { ONBOARDING_NEXT_PATH, ONBOARDING_STATES, isOnboardingState } from '../constants/onboardingStates.js';
import { ApiError } from '../utils/ApiError.js';

const incompleteStates = [
  ONBOARDING_STATES.LEVEL_PENDING,
  ONBOARDING_STATES.PREFERENCES_PENDING,
  ONBOARDING_STATES.ASSESSMENT_CHOICE_PENDING,
  ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS,
  ONBOARDING_STATES.ASSESSMENT_COMPLETED,
  ONBOARDING_STATES.ROADMAP_PENDING,
  ONBOARDING_STATES.ROADMAP_GENERATING,
  ONBOARDING_STATES.ROADMAP_FAILED
];

const findCurrentGoal = (userId) => LearningGoal.findOne({
  user: userId,
  status: { $ne: 'archived' }
}).sort({ createdAt: -1 });

const requireCurrentGoal = async ({ userId, learningGoalId = null }) => {
  const filter = { user: userId, status: { $ne: 'archived' } };
  if (learningGoalId) filter._id = learningGoalId;
  const goal = await LearningGoal.findOne(filter).sort({ createdAt: -1 });
  if (!goal) throw new ApiError(404, 'Learning goal not found', [], 'LEARNING_GOAL_NOT_FOUND');
  return goal;
};

const deriveState = ({ goal, activeCourse, assessment, roadmapJob }) => {
  if (!goal) return activeCourse ? ONBOARDING_STATES.COMPLETED : ONBOARDING_STATES.GOAL_PENDING;

  if (goal.onboardingState === ONBOARDING_STATES.ROADMAP_GENERATING) {
    if (roadmapJob?.status === 'failed') return ONBOARDING_STATES.ROADMAP_FAILED;
    if (roadmapJob?.status === 'completed' && activeCourse) return ONBOARDING_STATES.COMPLETED;
    return ONBOARDING_STATES.ROADMAP_GENERATING;
  }
  if (goal.onboardingState === ONBOARDING_STATES.ROADMAP_FAILED) {
    return ONBOARDING_STATES.ROADMAP_FAILED;
  }
  if (goal.onboardingState === ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS) {
    return assessment?.status === 'completed'
      ? ONBOARDING_STATES.ASSESSMENT_COMPLETED
      : ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS;
  }
  if (goal.onboardingState === ONBOARDING_STATES.ASSESSMENT_COMPLETED) {
    return ONBOARDING_STATES.ASSESSMENT_COMPLETED;
  }

  if (activeCourse) return ONBOARDING_STATES.COMPLETED;
  if (roadmapJob?.status === 'queued' || roadmapJob?.status === 'processing') {
    return ONBOARDING_STATES.ROADMAP_GENERATING;
  }
  if (roadmapJob?.status === 'failed') return ONBOARDING_STATES.ROADMAP_FAILED;
  if (assessment?.status === 'started') return ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS;
  if (assessment?.status === 'completed' && goal.assessmentPreference === 'take') {
    return ONBOARDING_STATES.ASSESSMENT_COMPLETED;
  }
  if (goal.onboardingState && isOnboardingState(goal.onboardingState)) {
    return goal.onboardingState;
  }
  if (!goal.level) return ONBOARDING_STATES.LEVEL_PENDING;
  if (goal.status === 'completed' || goal.assessmentPreference === 'skip') {
    return ONBOARDING_STATES.ROADMAP_PENDING;
  }
  return goal.level === 'beginner'
    ? ONBOARDING_STATES.PREFERENCES_PENDING
    : ONBOARDING_STATES.ASSESSMENT_CHOICE_PENDING;
};

const persistDerivedState = async (goal, state) => {
  if (!goal || goal.onboardingState === state) return;
  goal.onboardingState = state;
  if (state === ONBOARDING_STATES.COMPLETED && !goal.onboardingCompletedAt) {
    goal.onboardingCompletedAt = new Date();
  }
  await goal.save();
};

export const getOnboardingStatus = async (userId) => {
  const [activeCourse, latestGoal] = await Promise.all([
    CoursePlan.findOne({ user: userId, status: 'active', isActive: true })
      .select('_id title status version roadmapType aiGenerated')
      .sort({ createdAt: -1 }),
    findCurrentGoal(userId)
  ]);

  const [latestAssessment, roadmapJob] = latestGoal
    ? await Promise.all([
      Assessment.findOne({ user: userId, learningGoal: latestGoal._id })
        .select('_id status score completedAt level')
        .sort({ createdAt: -1 }),
      AIJob.findOne({
        user: userId,
        type: 'roadmap_generation',
        'input.learningGoalId': latestGoal._id
      }).select('_id status error attempts completedAt createdAt').sort({ createdAt: -1 })
    ])
    : [null, null];

  const state = deriveState({ goal: latestGoal, activeCourse, assessment: latestAssessment, roadmapJob });
  await persistDerivedState(latestGoal, state);

  let nextPath = ONBOARDING_NEXT_PATH[state];
  if (state === ONBOARDING_STATES.ASSESSMENT_COMPLETED && latestAssessment?._id) {
    nextPath = `/onboarding/assessment-report/${latestAssessment._id}`;
  }

  return {
    state,
    nextPath,
    hasActiveCourse: Boolean(activeCourse),
    activeCourse,
    currentGoal: latestGoal,
    latestGoal,
    latestAssessment,
    roadmapJob,
    canResume: state !== ONBOARDING_STATES.COMPLETED,
    error: state === ONBOARDING_STATES.ROADMAP_FAILED
      ? {
        code: latestGoal?.onboardingErrorCode || 'ROADMAP_GENERATION_FAILED',
        message: latestGoal?.onboardingErrorMessage || roadmapJob?.error || 'Roadmap generation failed'
      }
      : null
  };
};

export const saveGoalSelection = async ({ userId, goalKey, goalTitle }) => {
  const activeCourse = await CoursePlan.exists({ user: userId, status: 'active', isActive: true });
  if (activeCourse) {
    throw new ApiError(409, 'Onboarding is already complete', [], 'ONBOARDING_ALREADY_COMPLETED');
  }

  let goal = await LearningGoal.findOne({
    user: userId,
    status: { $ne: 'archived' },
    $or: [
      { onboardingState: { $in: incompleteStates } },
      { onboardingState: { $exists: false } }
    ]
  }).sort({ createdAt: -1 });

  if (!goal) goal = new LearningGoal({ user: userId });

  const changedGoal = goal.goalKey !== goalKey;
  goal.goalKey = goalKey;
  goal.goalTitle = goalTitle;
  goal.onboardingState = ONBOARDING_STATES.LEVEL_PENDING;
  goal.status = 'draft';
  goal.onboardingErrorCode = '';
  goal.onboardingErrorMessage = '';

  if (changedGoal) {
    goal.level = null;
    goal.preferencesCompletedAt = null;
    goal.assessmentChoiceAt = null;
    goal.assessmentPreference = 'not_applicable';
  }

  await goal.save();
  return goal;
};

export const saveLevelSelection = async ({ userId, learningGoalId = null, level }) => {
  const goal = await requireCurrentGoal({ userId, learningGoalId });
  goal.level = level;
  goal.assessmentPreference = 'not_applicable';
  goal.assessmentChoiceAt = null;
  goal.onboardingErrorCode = '';
  goal.onboardingErrorMessage = '';
  goal.onboardingState = level === 'beginner'
    ? ONBOARDING_STATES.PREFERENCES_PENDING
    : ONBOARDING_STATES.ASSESSMENT_CHOICE_PENDING;
  await goal.save();
  return goal;
};

export const createLearningGoal = async ({ userId, goalKey, goalTitle, level = null }) => {
  const goal = await saveGoalSelection({ userId, goalKey, goalTitle });
  if (!level) return goal;
  return saveLevelSelection({ userId, learningGoalId: goal._id, level });
};

export const savePreferencesOnly = async ({ userId, learningGoalId = null, preferences }) => {
  const goal = await requireCurrentGoal({ userId, learningGoalId });
  if (!goal.level) throw new ApiError(409, 'Choose your current level first', [], 'ONBOARDING_STEP_REQUIRED');

  Object.assign(goal, preferences);
  goal.preferencesCompletedAt = new Date();
  goal.onboardingErrorCode = '';
  goal.onboardingErrorMessage = '';

  if (goal.level === 'beginner') {
    goal.assessmentPreference = 'not_applicable';
    goal.status = 'completed';
    goal.onboardingState = ONBOARDING_STATES.ROADMAP_PENDING;
  } else {
    goal.onboardingState = ONBOARDING_STATES.ASSESSMENT_CHOICE_PENDING;
  }

  await goal.save();
  return goal;
};

export const markAssessmentSkipped = async ({ userId, learningGoalId = null }) => {
  const goal = await requireCurrentGoal({ userId, learningGoalId });
  if (!goal.level) throw new ApiError(409, 'Choose your current level first', [], 'ONBOARDING_STEP_REQUIRED');

  goal.assessmentPreference = goal.level === 'beginner' ? 'not_applicable' : 'skip';
  goal.assessmentChoiceAt = new Date();
  goal.status = 'completed';
  goal.onboardingState = ONBOARDING_STATES.ROADMAP_PENDING;
  goal.onboardingErrorCode = '';
  goal.onboardingErrorMessage = '';
  await goal.save();
  return goal;
};

export const markAssessmentStarted = async ({ userId, learningGoalId }) => {
  const goal = await requireCurrentGoal({ userId, learningGoalId });
  goal.assessmentPreference = 'take';
  goal.assessmentChoiceAt = goal.assessmentChoiceAt || new Date();
  goal.onboardingState = ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS;
  goal.onboardingErrorCode = '';
  goal.onboardingErrorMessage = '';
  await goal.save();
  return goal;
};

export const markAssessmentCompleted = async ({ userId, learningGoalId }) => {
  const goal = await requireCurrentGoal({ userId, learningGoalId });
  goal.assessmentPreference = 'take';
  goal.status = 'completed';
  goal.onboardingState = ONBOARDING_STATES.ASSESSMENT_COMPLETED;
  goal.onboardingErrorCode = '';
  goal.onboardingErrorMessage = '';
  await goal.save();
  return goal;
};

export const setRoadmapOnboardingState = async ({
  userId,
  learningGoalId,
  state,
  roadmapJobId = null,
  errorCode = '',
  errorMessage = ''
}) => {
  if (![ONBOARDING_STATES.ROADMAP_PENDING, ONBOARDING_STATES.ROADMAP_GENERATING, ONBOARDING_STATES.ROADMAP_FAILED, ONBOARDING_STATES.COMPLETED].includes(state)) {
    throw new ApiError(500, 'Invalid roadmap onboarding state', [], 'INVALID_ONBOARDING_STATE');
  }

  const goal = await requireCurrentGoal({ userId, learningGoalId });
  goal.onboardingState = state;
  goal.roadmapJob = roadmapJobId || goal.roadmapJob;
  goal.onboardingErrorCode = errorCode;
  goal.onboardingErrorMessage = errorMessage;
  if (state === ONBOARDING_STATES.COMPLETED) {
    goal.onboardingCompletedAt = new Date();
  }
  await goal.save();
  return goal;
};
