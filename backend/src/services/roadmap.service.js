import { CoursePlan } from '../models/CoursePlan.js';
import { Enrollment } from '../models/Enrollment.js';
import { Assessment } from '../models/Assessment.js';
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

const mergeAiModules = (templateModules = [], aiModules = []) => {
  if (!templateModules.length || aiModules.length !== templateModules.length) return null;
  const bySourceOrder = new Map(templateModules.map((module) => [Number(module.order), module]));
  const used = new Set();
  const merged = [];

  for (const aiModule of aiModules) {
    const sourceOrder = Number(aiModule.sourceOrder);
    const source = bySourceOrder.get(sourceOrder);
    if (!source || used.has(sourceOrder)) return null;
    used.add(sourceOrder);
    merged.push({
      ...source,
      title: aiModule.title || source.title,
      description: aiModule.description ?? source.description,
      order: Number(aiModule.order) || source.order,
      durationDays: Number(aiModule.durationDays) || source.durationDays
    });
  }

  const outputOrders = merged.map((module) => Number(module.order));
  if (new Set(outputOrders).size !== outputOrders.length || outputOrders.some((order) => !Number.isInteger(order) || order < 1)) {
    return null;
  }
  return merged;
};

const resolveEnrollmentCourse = async ({ userId, enrollmentId }) => {
  const enrollment = await Enrollment.findOne({ _id: enrollmentId, user: userId })
    .populate('course', 'title slug description category technologies primaryTechnology availableLevels status')
    .populate('currentCourse', 'title slug description category technologies primaryTechnology availableLevels status')
    .populate('learningPath');
  if (!enrollment) throw new ApiError(404, 'Enrollment not found', [], 'ENROLLMENT_NOT_FOUND');

  const course = enrollment.currentCourse || enrollment.course;
  if (!course || course.status !== 'published') {
    throw new ApiError(409, 'Selected course is not available', [], 'COURSE_NOT_AVAILABLE');
  }

  let level = enrollment.level;
  if (enrollment.type === 'learning_path' && enrollment.learningPath) {
    const pathEntry = (enrollment.learningPath.courses || []).find((item) => item.course?.toString() === course._id.toString());
    level = pathEntry?.defaultLevel || level;
  }
  if (!level) throw new ApiError(409, 'Choose a course level before generating a roadmap', [], 'LEVEL_REQUIRED');
  if (!(course.availableLevels || []).includes(level)) {
    throw new ApiError(409, 'This course does not support the selected level', [], 'LEVEL_NOT_AVAILABLE');
  }

  return { enrollment, course, level };
};

export const getActiveRoadmapForEnrollment = ({ userId, enrollmentId }) => CoursePlan.findOne({
  user: userId,
  enrollment: enrollmentId,
  status: COURSE_STATUS.ACTIVE,
  isActive: true
}).sort({ updatedAt: -1 });

export const createCourseFromTemplate = async ({
  userId,
  enrollmentId,
  roadmapType = ROADMAP_TYPES.TEMPLATE,
  assessmentId = null,
  generatedReason = null
}) => {
  const { enrollment, course: catalogCourse, level } = await resolveEnrollmentCourse({ userId, enrollmentId });
  const template = await getPublishedTemplate({ courseId: catalogCourse._id, level });
  let roadmapTitle = template.title;
  let roadmapDescription = template.description;
  let templateForResolution = template;
  let aiGenerated = false;
  const shouldUseAI = isGeminiAvailable() && roadmapType !== ROADMAP_TYPES.TEMPLATE;

  if (shouldUseAI) {
    try {
      await checkAIUsageLimit(userId, AI_FEATURES.ROADMAP_GENERATION);
      const assessment = assessmentId
        ? await Assessment.findOne({ _id: assessmentId, user: userId, enrollment: enrollmentId, course: catalogCourse._id, status: 'completed' }).lean()
        : null;
      const aiRoadmap = await aiProvider.generateRoadmap({
        template,
        enrollment: enrollment.toObject(),
        course: catalogCourse.toObject(),
        assessment
      });
      const personalizedModules = mergeAiModules(template.modules || [], aiRoadmap?.modules || []);

      if (personalizedModules) {
        roadmapTitle = aiRoadmap.title || template.title;
        roadmapDescription = aiRoadmap.description || template.description;
        const templateObject = typeof template.toObject === 'function' ? template.toObject() : template;
        templateForResolution = { ...templateObject, modules: personalizedModules, _aiGenerated: true };
        aiGenerated = true;
        await logAIUsage({
          user: userId,
          feature: AI_FEATURES.ROADMAP_GENERATION,
          model: aiRoadmap.model || env.geminiModel,
          provider: 'gemini',
          inputTokens: aiRoadmap.inputTokens || 0,
          outputTokens: aiRoadmap.outputTokens || 0
        });
      }
    } catch (error) {
      await logAIUsage({
        user: userId,
        feature: AI_FEATURES.ROADMAP_GENERATION,
        status: 'failed',
        model: env.geminiModel,
        provider: 'gemini',
        errorMessage: error.message
      });
    }
  }

  const modules = await resolveTemplateModules(templateForResolution);
  const previousActive = await CoursePlan.findOne({
    enrollment: enrollmentId,
    status: COURSE_STATUS.ACTIVE,
    isActive: true
  }).sort({ version: -1 });
  const latestVersion = await CoursePlan.findOne({ enrollment: enrollmentId }).sort({ version: -1 }).select('version');
  const nextVersion = (latestVersion?.version || 0) + 1;

  await CoursePlan.updateMany(
    { enrollment: enrollmentId, status: COURSE_STATUS.ACTIVE, isActive: true },
    { status: COURSE_STATUS.ARCHIVED, isActive: false }
  );

  const coursePlan = await CoursePlan.create({
    user: userId,
    enrollment: enrollmentId,
    course: catalogCourse._id,
    learningPath: enrollment.learningPath?._id || enrollment.learningPath || null,
    title: roadmapTitle,
    description: roadmapDescription,
    level,
    roadmapType: aiGenerated ? roadmapType : ROADMAP_TYPES.TEMPLATE,
    modules,
    status: COURSE_STATUS.ACTIVE,
    aiGenerated,
    version: nextVersion,
    parentCoursePlan: previousActive?._id || null,
    generatedReason: generatedReason || reasonByRoadmapType[roadmapType] || 'manual_regeneration',
    isActive: true
  });

  enrollment.status = 'active';
  enrollment.currentCourse = catalogCourse._id;
  await enrollment.save();
  await createProgressForCourse({ userId, coursePlanId: coursePlan._id });
  await setRoadmapOnboardingState({ userId, enrollmentId, state: ONBOARDING_STATES.COMPLETED });
  await invalidateUserLearningCache(userId);
  await logActivity({
    user: userId,
    action: 'roadmap_generated',
    entityType: 'CoursePlan',
    entityId: coursePlan._id,
    message: `Roadmap v${coursePlan.version} generated`,
    metadata: {
      enrollmentId: enrollmentId.toString(),
      courseId: catalogCourse._id.toString(),
      roadmapType: coursePlan.roadmapType,
      generatedReason: coursePlan.generatedReason,
      aiGenerated: coursePlan.aiGenerated
    }
  });

  return coursePlan;
};

export const createCourseFromAssessment = async ({ userId, enrollmentId, assessmentId }) => {
  const assessment = await Assessment.findOne({ _id: assessmentId, user: userId, enrollment: enrollmentId, status: 'completed' });
  if (!assessment) throw new ApiError(404, 'Assessment report not found');
  return createCourseFromTemplate({
    userId,
    enrollmentId,
    assessmentId,
    roadmapType: ROADMAP_TYPES.ASSESSMENT_AI_PERSONALIZED,
    generatedReason: 'assessment_personalized'
  });
};

export const personalizeCurrentRoadmapLater = async ({ userId }) => {
  const activeCourse = await CoursePlan.findOne({ user: userId, status: COURSE_STATUS.ACTIVE, isActive: true }).sort({ updatedAt: -1 });
  if (!activeCourse) throw new ApiError(404, 'No active roadmap found');
  return {
    message: 'Take the diagnostic assessment to create a personalized roadmap version.',
    enrollmentId: activeCourse.enrollment,
    nextPath: '/onboarding/assessment?personalize=true'
  };
};

export const getCurrentCourse = async (userId) => CoursePlan.findOne({ user: userId, status: COURSE_STATUS.ACTIVE, isActive: true })
  .populate('course', 'title slug category technologies primaryTechnology')
  .populate('modules.lessons.lesson')
  .populate('modules.quizQuestions')
  .sort({ updatedAt: -1 });

export const getRoadmapVersions = async (userId) => CoursePlan.find({ user: userId })
  .select('_id enrollment course title level version roadmapType generatedReason status isActive aiGenerated createdAt')
  .populate('course', 'title slug')
  .sort({ createdAt: -1 });
