import { CoursePlan } from '../models/CoursePlan.js';
import { Enrollment } from '../models/Enrollment.js';
import { Assessment } from '../models/Assessment.js';
import { Lesson } from '../models/Lesson.js';
import { ROADMAP_TYPES, COURSE_STATUS } from '../constants/roadmapTypes.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { getPublishedTemplate, resolveTemplateModules } from './templateRoadmap.service.js';
import { carryProgressToCourse, mergeWeakTopics } from './progress.service.js';
import { checkAIUsageLimit, logAIUsage } from './aiUsage.service.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { logActivity } from './activityLog.service.js';
import { ApiError } from '../utils/ApiError.js';
import { env, isGeminiAvailable } from '../config/env.js';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';
import { setRoadmapOnboardingState } from './onboarding.service.js';
import {
  getActiveCourseForUser,
  getCurrentEnrollmentForUser,
  setCurrentEnrollmentForUser
} from './dataIntegrity.service.js';

const levelOrder = ['beginner', 'intermediate', 'advanced'];

const reasonByRoadmapType = {
  [ROADMAP_TYPES.TEMPLATE]: 'initial_template',
  [ROADMAP_TYPES.ASSESSMENT_AI_PERSONALIZED]: 'assessment_personalized'
};

const referenceId = (value) => value?._id || value;
const referenceString = (value) => referenceId(value)?.toString?.() || '';
const normalizeTopicName = (value = '') => String(value).trim().toLowerCase();

const sanitizeTopicScoresForAI = (items = []) => items.map((item) => ({
  topic: item.topic,
  score: item.score,
  ...(Number.isFinite(Number(item.total)) ? { total: item.total } : {})
}));

const buildAssessmentSummary = (assessment) => assessment ? {
  score: assessment.score,
  level: assessment.level,
  categoryScores: sanitizeTopicScoresForAI(assessment.categoryScores || []),
  weakTopics: sanitizeTopicScoresForAI(assessment.weakTopics || []),
  strongTopics: sanitizeTopicScoresForAI(assessment.strongTopics || [])
} : null;

const buildFallbackSummary = (assessment) => {
  const weakTopics = assessment?.weakTopics || [];
  if (!weakTopics.length) {
    return 'Your skill check did not identify any urgent weak topics. Continue with your selected level and keep practicing.';
  }
  return `Focus first on ${weakTopics.slice(0, 3).map((item) => item.topic).join(', ')}. These were the main gaps found in your skill check.`;
};

const buildFallbackFocusReason = (focusArea) => {
  const details = focusArea.weakTopics
    .map((item) => `${item.topic} (${item.score}%)`)
    .join(', ');
  return `Your skill check showed that ${details} needs more practice. Review the related lessons before moving on.`;
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

const getCumulativeLevels = ({ availableLevels = [], level }) => {
  const currentIndex = levelOrder.indexOf(level);
  if (currentIndex < 0) return [level];
  return levelOrder
    .slice(0, currentIndex + 1)
    .filter((item) => availableLevels.includes(item));
};

const resolveCumulativeModules = async ({ catalogCourse, level, currentTemplate }) => {
  const levels = getCumulativeLevels({ availableLevels: catalogCourse.availableLevels || [], level });
  const resolvedModules = [];
  let globalOrder = 1;

  for (const roadmapLevel of levels) {
    const template = roadmapLevel === level
      ? currentTemplate
      : await getPublishedTemplate({ courseId: catalogCourse._id, level: roadmapLevel });
    const modules = await resolveTemplateModules(template);

    modules
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
      .forEach((module) => {
        resolvedModules.push({
          ...module,
          level: roadmapLevel,
          order: globalOrder
        });
        globalOrder += 1;
      });
  }

  return resolvedModules;
};

const buildVerifiedFocusAreas = async ({ catalogCourse, modules, assessment }) => {
  const weakTopics = assessment?.weakTopics || [];
  if (!weakTopics.length) return [];

  const lessonIds = modules
    .flatMap((module) => module.lessons || [])
    .map((item) => referenceId(item.lesson))
    .filter(Boolean);
  if (!lessonIds.length) return [];

  const lessons = await Lesson.find({
    _id: { $in: lessonIds },
    course: catalogCourse._id,
    status: 'published'
  })
    .select('_id title topic')
    .populate('topic', 'title')
    .lean();

  const lessonById = new Map(lessons.map((lesson) => [lesson._id.toString(), lesson]));
  const weakByRef = new Map();
  const weakByTitle = new Map();

  weakTopics.forEach((weak) => {
    const topicRef = referenceString(weak.topicRef);
    if (topicRef) weakByRef.set(topicRef, weak);
    if (weak.topic) weakByTitle.set(normalizeTopicName(weak.topic), weak);
  });

  return modules.map((module, moduleIndex) => {
    const matchedWeakTopics = new Map();
    const lessonTitles = [];

    (module.lessons || []).forEach((item) => {
      const lesson = lessonById.get(referenceString(item.lesson));
      if (!lesson) return;
      lessonTitles.push(lesson.title);

      const lessonTopicRef = referenceString(lesson.topic);
      const lessonTopicTitle = lesson.topic?.title || '';
      const weak = weakByRef.get(lessonTopicRef) || weakByTitle.get(normalizeTopicName(lessonTopicTitle));
      if (!weak) return;

      const weakKey = referenceString(weak.topicRef) || normalizeTopicName(weak.topic);
      if (!matchedWeakTopics.has(weakKey)) {
        matchedWeakTopics.set(weakKey, { topic: weak.topic, score: weak.score });
      }
    });

    if (!matchedWeakTopics.size) return null;

    return {
      focusKey: `${module.level || 'current'}-module-${module.order}`,
      moduleIndex,
      moduleTitle: module.title,
      level: module.level,
      weakTopics: [...matchedWeakTopics.values()],
      lessonTitles: lessonTitles.slice(0, 6)
    };
  }).filter(Boolean);
};

const getAiAdviceByFocusKey = ({ verifiedFocusAreas, aiFocusAreas = [] }) => {
  const allowedKeys = new Set(verifiedFocusAreas.map((item) => item.focusKey));
  const adviceByKey = new Map();

  aiFocusAreas.forEach((item) => {
    if (!allowedKeys.has(item.focusKey) || adviceByKey.has(item.focusKey)) return;
    const advice = String(item.advice || '').trim();
    if (advice) adviceByKey.set(item.focusKey, advice);
  });

  return adviceByKey;
};

const applyVerifiedFocusToModules = ({ modules, verifiedFocusAreas, adviceByKey }) => {
  const focusByModuleIndex = new Map(verifiedFocusAreas.map((item) => [item.moduleIndex, item]));

  return modules.map((module, moduleIndex) => {
    const focusArea = focusByModuleIndex.get(moduleIndex);
    if (!focusArea) return module;

    return {
      ...module,
      highPriority: true,
      focusTopics: focusArea.weakTopics,
      focusReason: adviceByKey.get(focusArea.focusKey) || buildFallbackFocusReason(focusArea)
    };
  });
};

export const getActiveRoadmapForEnrollment = async ({ userId, enrollmentId }) => {
  const { course, level } = await resolveEnrollmentCourse({ userId, enrollmentId });
  return CoursePlan.findOne({
    user: userId,
    enrollment: enrollmentId,
    course: course._id,
    level,
    status: COURSE_STATUS.ACTIVE,
    isActive: true
  }).sort({ updatedAt: -1 });
};

export const createCourseFromTemplate = async ({
  userId,
  enrollmentId,
  roadmapType = ROADMAP_TYPES.TEMPLATE,
  assessmentId = null,
  generatedReason = null
}) => {
  const { enrollment, course: catalogCourse, level } = await resolveEnrollmentCourse({ userId, enrollmentId });
  const template = await getPublishedTemplate({ courseId: catalogCourse._id, level });
  const assessment = assessmentId
    ? await Assessment.findOne({
      _id: assessmentId,
      user: userId,
      enrollment: enrollmentId,
      course: catalogCourse._id,
      level,
      status: 'completed'
    }).lean()
    : null;

  if (assessmentId && !assessment) {
    throw new ApiError(404, 'Completed skill check not found for the selected course level');
  }

  let modules = await resolveCumulativeModules({
    catalogCourse,
    level,
    currentTemplate: template
  });
  const verifiedFocusAreas = await buildVerifiedFocusAreas({ catalogCourse, modules, assessment });
  let personalizationSummary = assessment ? buildFallbackSummary(assessment) : '';
  let adviceByKey = new Map();
  let aiGenerated = false;
  const shouldUseAI = isGeminiAvailable() && roadmapType === ROADMAP_TYPES.ASSESSMENT_AI_PERSONALIZED && Boolean(assessment);

  if (shouldUseAI) {
    try {
      await checkAIUsageLimit(userId, AI_FEATURES.ROADMAP_GENERATION);
      const aiRoadmap = await aiProvider.generateRoadmap({
        enrollment: enrollment.toObject(),
        course: catalogCourse.toObject(),
        assessment: buildAssessmentSummary(assessment),
        focusAreas: verifiedFocusAreas.map(({ focusKey, moduleTitle, level: focusLevel, weakTopics, lessonTitles }) => ({
          focusKey,
          moduleTitle,
          level: focusLevel,
          weakTopics,
          lessonTitles
        }))
      });

      personalizationSummary = aiRoadmap.summary || personalizationSummary;
      adviceByKey = getAiAdviceByFocusKey({
        verifiedFocusAreas,
        aiFocusAreas: aiRoadmap.focusAreas || []
      });
      aiGenerated = true;
      await logAIUsage({
        user: userId,
        feature: AI_FEATURES.ROADMAP_GENERATION,
        model: aiRoadmap.model || env.geminiModel
      });
    } catch (error) {
      await logAIUsage({
        user: userId,
        feature: AI_FEATURES.ROADMAP_GENERATION,
        status: 'failed',
        model: env.geminiModel,
        errorMessage: error.message
      });
    }
  }

  modules = applyVerifiedFocusToModules({ modules, verifiedFocusAreas, adviceByKey });

  const planFilter = { enrollment: enrollmentId, course: catalogCourse._id };
  const previousActive = await CoursePlan.findOne({
    ...planFilter,
    status: COURSE_STATUS.ACTIVE,
    isActive: true
  }).sort({ version: -1 });
  const latestVersion = await CoursePlan.findOne(planFilter).sort({ version: -1 }).select('version');
  const nextVersion = (latestVersion?.version || 0) + 1;

  await CoursePlan.updateMany(
    { ...planFilter, status: COURSE_STATUS.ACTIVE, isActive: true },
    { status: COURSE_STATUS.ARCHIVED, isActive: false }
  );

  const requestedReason = generatedReason || reasonByRoadmapType[roadmapType] || 'manual_regeneration';

  const coursePlan = await CoursePlan.create({
    user: userId,
    enrollment: enrollmentId,
    course: catalogCourse._id,
    learningPath: enrollment.learningPath?._id || enrollment.learningPath || null,
    assessment: assessment?._id || null,
    title: template.title,
    description: template.description,
    personalizationSummary,
    level,
    roadmapType: assessment ? roadmapType : ROADMAP_TYPES.TEMPLATE,
    modules,
    status: COURSE_STATUS.ACTIVE,
    aiGenerated,
    version: nextVersion,
    parentCoursePlan: previousActive?._id || null,
    generatedReason: requestedReason,
    isActive: true
  });

  enrollment.status = 'active';
  enrollment.currentCourse = catalogCourse._id;
  await enrollment.save();
  const progress = await carryProgressToCourse({
    userId,
    previousCoursePlanId: previousActive?._id || null,
    coursePlanId: coursePlan._id
  });
  if (progress && assessment?.weakTopics?.length) {
    await mergeWeakTopics({ progress, weakTopics: assessment.weakTopics, source: 'assessment' });
  }
  await setRoadmapOnboardingState({ userId, enrollmentId, state: ONBOARDING_STATES.COMPLETED });
  await setCurrentEnrollmentForUser({ userId, enrollmentId });
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
  const activeCourse = await getActiveCourseForUser({ userId });
  if (!activeCourse) throw new ApiError(404, 'No active roadmap found');
  return {
    message: 'Take the diagnostic assessment to create a personalized roadmap version.',
    enrollmentId: activeCourse.enrollment,
    nextPath: '/onboarding/assessment?personalize=true'
  };
};

export const getCurrentCourse = async (userId) => {
  const activeCourse = await getActiveCourseForUser({ userId });
  if (!activeCourse) return null;
  return CoursePlan.findById(activeCourse._id)
    .populate('course', 'title slug category technologies primaryTechnology')
    .populate('modules.lessons.lesson')
    .populate('modules.quizQuestions');
};

export const getRoadmapVersions = async (userId) => {
  const enrollment = await getCurrentEnrollmentForUser(userId);
  if (!enrollment) return [];
  const courseId = enrollment.currentCourse || enrollment.course;
  if (!courseId) return [];
  return CoursePlan.find({ user: userId, enrollment: enrollment._id, course: courseId })
    .select('_id enrollment course title level version roadmapType generatedReason status isActive aiGenerated createdAt')
    .populate('course', 'title slug')
    .sort({ createdAt: -1 });
};
