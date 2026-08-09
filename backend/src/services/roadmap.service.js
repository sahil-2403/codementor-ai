import mongoose from 'mongoose';
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

const generatedCourseFilter = ({ userId, generationJobId, generationKey }) => {
  if (generationJobId) return { user: userId, generationJob: generationJobId };
  if (generationKey) return { user: userId, generationKey };
  return null;
};

const findGeneratedCourse = async ({ userId, generationJobId, generationKey, session = null }) => {
  const filter = generatedCourseFilter({ userId, generationJobId, generationKey });
  if (!filter) return null;
  const query = CoursePlan.findOne(filter);
  if (session) query.session(session);
  return query;
};

const ensureGeneratedCourseReady = async ({ course, userId, session = null }) => {
  if (!course) return null;
  await createProgressForCourse({ userId, coursePlanId: course._id, session });
  return course;
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

export const createCourseFromTemplate = async ({
  userId,
  enrollmentId,
  roadmapType = ROADMAP_TYPES.TEMPLATE,
  assessmentId = null,
  generatedReason = null,
  generationJobId = null,
  generationKey = null
}) => {
  const existingCourse = await findGeneratedCourse({ userId, generationJobId, generationKey });
  if (existingCourse) return ensureGeneratedCourseReady({ course: existingCourse, userId });

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
      if (aiRoadmap?.modules?.length) {
        roadmapTitle = aiRoadmap.title || template.title;
        roadmapDescription = aiRoadmap.description || template.description;
        const templateObject = typeof template.toObject === 'function' ? template.toObject() : template;
        templateForResolution = { ...templateObject, modules: aiRoadmap.modules, _aiGenerated: true };
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
  let coursePlan;

  const persistCourse = async (session = null) => {
    const alreadyCreated = await findGeneratedCourse({ userId, generationJobId, generationKey, session });
    if (alreadyCreated) {
      coursePlan = await ensureGeneratedCourseReady({ course: alreadyCreated, userId, session });
      return;
    }

    const maybeSession = (query) => (session ? query.session(session) : query);
    const previousActive = await maybeSession(
      CoursePlan.findOne({ enrollment: enrollmentId, status: COURSE_STATUS.ACTIVE, isActive: true }).sort({ version: -1 })
    );
    const latestVersion = await maybeSession(
      CoursePlan.findOne({ enrollment: enrollmentId }).sort({ version: -1 }).select('version')
    );
    const nextVersion = (latestVersion?.version || 0) + 1;

    await CoursePlan.updateMany(
      { enrollment: enrollmentId, status: COURSE_STATUS.ACTIVE, isActive: true },
      { status: COURSE_STATUS.ARCHIVED, isActive: false },
      session ? { session } : undefined
    );

    const createPayload = {
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
      generationJob: generationJobId || undefined,
      generationKey: generationKey || undefined,
      generatedReason: generatedReason || reasonByRoadmapType[roadmapType] || 'manual_regeneration',
      isActive: true
    };

    const createdCourses = await CoursePlan.create([createPayload], session ? { session } : undefined);
    const createdCourse = createdCourses[0];

    enrollment.status = 'active';
    enrollment.currentCourse = catalogCourse._id;
    await enrollment.save(session ? { session } : undefined);
    await createProgressForCourse({ userId, coursePlanId: createdCourse._id, session });
    coursePlan = createdCourse;
  };

  try {
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
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const recoveredCourse = await findGeneratedCourse({ userId, generationJobId, generationKey });
    if (!recoveredCourse) throw error;
    coursePlan = await ensureGeneratedCourseReady({ course: recoveredCourse, userId });
  }

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
      aiGenerated: coursePlan.aiGenerated,
      generationJobId: generationJobId?.toString?.() || null
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
