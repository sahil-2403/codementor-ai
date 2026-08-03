import mongoose from 'mongoose';
import { CoursePlan } from '../models/CoursePlan.js';
import { LearningGoal } from '../models/LearningGoal.js';
import { Assessment } from '../models/Assessment.js';
import { AIJob } from '../models/AIJob.js';
import { ROADMAP_TYPES, COURSE_STATUS } from '../constants/roadmapTypes.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { getPublishedTemplate, resolveTemplateModules } from './templateRoadmap.service.js';
import { createProgressForCourse } from './progress.service.js';
import { checkAIUsageLimit, logAIUsage } from './aiUsage.service.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { logActivity } from './activityLog.service.js';
import { invalidateUserLearningCache } from './cacheInvalidation.service.js';
import { ApiError } from '../utils/ApiError.js';
import { env, isGeminiAvailable } from '../config/env.js';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';
import { setRoadmapOnboardingState } from './onboarding.service.js';

const reasonByRoadmapType = {
  [ROADMAP_TYPES.TEMPLATE]: 'initial_template',
  [ROADMAP_TYPES.TEMPLATE_AI_ADJUSTED]: 'preference_adjusted',
  [ROADMAP_TYPES.ASSESSMENT_AI_PERSONALIZED]: 'assessment_personalized'
};

export const assertNoRoadmapGenerationInProgress = async (userId) => {
  const existingJob = await AIJob.findOne({ user: userId, type: 'roadmap_generation', status: { $in: ['queued', 'processing'] } }).sort({ createdAt: -1 });
  if (existingJob) throw new ApiError(409, 'A roadmap generation job is already in progress. Please wait for it to finish.');
};

export const createCourseFromTemplate = async ({ userId, learningGoalId, roadmapType = ROADMAP_TYPES.TEMPLATE, assessmentId = null, generatedReason = null }) => {
  const goal = await LearningGoal.findOne({ _id: learningGoalId, user: userId });
  if (!goal) throw new ApiError(404, 'Learning goal not found');

  const template = await getPublishedTemplate({ goalKey: goal.goalKey, level: goal.level });
  let roadmapTitle = template.title;
  let roadmapDescription = template.description;
  let templateForResolution = template;
  let aiGenerated = false;
  const shouldUseAI = isGeminiAvailable() && roadmapType !== ROADMAP_TYPES.TEMPLATE;

  if (shouldUseAI) {
    try {
      await checkAIUsageLimit(userId, AI_FEATURES.ROADMAP_GENERATION);
      const assessment = assessmentId ? await Assessment.findOne({ _id: assessmentId, user: userId, learningGoal: learningGoalId, status: 'completed' }).lean() : null;
      const aiRoadmap = await aiProvider.generateRoadmap({ template, goal: goal.toObject(), assessment });
      if (aiRoadmap?.modules?.length) {
        roadmapTitle = aiRoadmap.title || template.title;
        roadmapDescription = aiRoadmap.description || template.description;
        const templateObject = typeof template.toObject === 'function' ? template.toObject() : template;
        templateForResolution = { ...templateObject, modules: aiRoadmap.modules, _aiGenerated: true };
        aiGenerated = true;
        await logAIUsage({ user: userId, feature: AI_FEATURES.ROADMAP_GENERATION, model: aiRoadmap.model || env.geminiModel, provider: 'gemini', inputTokens: aiRoadmap.inputTokens || 0, outputTokens: aiRoadmap.outputTokens || 0 });
      }
    } catch (error) {
      await logAIUsage({ user: userId, feature: AI_FEATURES.ROADMAP_GENERATION, status: 'failed', model: env.geminiModel, provider: 'gemini', errorMessage: error.message });
    }
  }

  const modules = await resolveTemplateModules(templateForResolution);
  let course;
  const persistCourse = async (session = null) => {
    const maybeSession = (query) => (session ? query.session(session) : query);
    const previousActive = await maybeSession(CoursePlan.findOne({ user: userId, status: COURSE_STATUS.ACTIVE, isActive: true }).sort({ version: -1 }));
    const latestVersion = await maybeSession(CoursePlan.findOne({ user: userId }).sort({ version: -1 }).select('version'));
    const nextVersion = (latestVersion?.version || 0) + 1;
    await CoursePlan.updateMany({ user: userId, status: COURSE_STATUS.ACTIVE }, { status: COURSE_STATUS.ARCHIVED, isActive: false }, session ? { session } : undefined);
    const createPayload = {
      user: userId,
      learningGoal: learningGoalId,
      title: roadmapTitle,
      description: roadmapDescription,
      level: goal.level,
      roadmapType: aiGenerated ? roadmapType : ROADMAP_TYPES.TEMPLATE,
      modules,
      status: COURSE_STATUS.ACTIVE,
      aiGenerated,
      version: nextVersion,
      parentCoursePlan: previousActive?._id || null,
      generatedReason: generatedReason || reasonByRoadmapType[roadmapType] || 'manual_regeneration',
      isActive: true
    };
    const createdCourses = await CoursePlan.create([createPayload], session ? { session } : undefined);
    const createdCourse = createdCourses[0];
    await LearningGoal.updateMany({ user: userId, _id: { $ne: goal._id }, status: 'active' }, { status: 'archived' }, session ? { session } : undefined);
    goal.status = 'active';
    await goal.save(session ? { session } : undefined);
    await createProgressForCourse({ userId, coursePlanId: createdCourse._id, session });
    course = createdCourse;
  };

  if (env.enableMongoTransactions) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(() => persistCourse(session));
    } finally {
      await session.endSession();
    }
  } else {
    await persistCourse();
  }

  await setRoadmapOnboardingState({
    userId,
    learningGoalId,
    state: ONBOARDING_STATES.COMPLETED
  });
  await invalidateUserLearningCache(userId);
  await logActivity({ user: userId, action: 'roadmap_generated', entityType: 'CoursePlan', entityId: course._id, message: `Roadmap v${course.version} generated`, metadata: { roadmapType: course.roadmapType, generatedReason: course.generatedReason, aiGenerated: course.aiGenerated } });
  return course;
};

export const createCourseFromAssessment = async ({ userId, learningGoalId, assessmentId }) => {
  const assessment = await Assessment.findOne({ _id: assessmentId, user: userId, learningGoal: learningGoalId, status: 'completed' });
  if (!assessment) throw new ApiError(404, 'Assessment report not found');
  return createCourseFromTemplate({ userId, learningGoalId, assessmentId, roadmapType: ROADMAP_TYPES.ASSESSMENT_AI_PERSONALIZED, generatedReason: 'assessment_personalized' });
};

export const personalizeCurrentRoadmapLater = async ({ userId }) => {
  const activeCourse = await CoursePlan.findOne({ user: userId, status: COURSE_STATUS.ACTIVE, isActive: true });
  if (!activeCourse) throw new ApiError(404, 'No active roadmap found');
  return { message: 'Take the diagnostic assessment to create a personalized roadmap version.', nextPath: '/onboarding/assessment' };
};

export const getCurrentCourse = async (userId) => CoursePlan.findOne({ user: userId, status: COURSE_STATUS.ACTIVE, isActive: true }).populate('modules.lessons.lesson').populate('modules.quizQuestions').sort({ createdAt: -1 });
export const getRoadmapVersions = async (userId) => CoursePlan.find({ user: userId }).select('_id title version roadmapType generatedReason status isActive aiGenerated createdAt').sort({ version: -1 });
