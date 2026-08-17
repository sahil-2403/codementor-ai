import { Progress } from '../models/Progress.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { getWeakTopicSeverity, getNextLessonFromCourse, buildLearningRecommendations, buildStudyPlan } from './recommendation.service.js';
import { scheduleRevisionForWeakTopic, getDueRevisions, getRevisionStats } from './revision.service.js';
import { assertLessonBelongsToCourse, getActiveCourseForUser } from './dataIntegrity.service.js';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';

const levelOrder = ['beginner', 'intermediate', 'advanced'];

const calculateCompletion = (course, completedLessonIds) => {
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  if (!totalLessons) return 0;
  return Math.round((completedLessonIds.length / totalLessons) * 100);
};

export const getNextAvailableCourseLevel = async (coursePlan) => {
  if (!coursePlan?.course || !coursePlan?.enrollment || !coursePlan?.level) return null;

  const enrollment = await Enrollment.findById(coursePlan.enrollment).select('type').lean();
  if (!enrollment || enrollment.type !== 'course') return null;

  const course = await Course.findById(coursePlan.course).select('availableLevels').lean();
  const currentIndex = levelOrder.indexOf(coursePlan.level);
  if (!course || currentIndex < 0) return null;

  return levelOrder
    .slice(currentIndex + 1)
    .find((level) => (course.availableLevels || []).includes(level)) || null;
};

export const createProgressForCourse = async ({ userId, coursePlanId }) => Progress.findOneAndUpdate(
  { user: userId, coursePlan: coursePlanId },
  { $setOnInsert: { user: userId, coursePlan: coursePlanId } },
  { new: true, upsert: true, setDefaultsOnInsert: true }
);

const buildCurrentProgressPayload = async (userId) => {
  const course = await getActiveCourseForUser({ userId, populate: true, lean: true });
  if (!course) return null;

  const [progress, dueRevisions, revisionStats, roadmapVersions] = await Promise.all([
    Progress.findOne({ user: userId, coursePlan: course._id }).lean(),
    getDueRevisions({ userId, coursePlanId: course._id }),
    getRevisionStats({ userId, coursePlanId: course._id }),
    CoursePlan.find({ user: userId, enrollment: course.enrollment, course: course.course })
      .select('_id title version roadmapType generatedReason status isActive createdAt')
      .sort({ version: -1 })
      .lean()
  ]);

  const nextLesson = getNextLessonFromCourse(course);
  const recommendations = buildLearningRecommendations({ course, progress, dueRevisions });
  const studyPlan = buildStudyPlan({ nextLesson, dueRevisions, progress });
  const isComplete = (progress?.overallCompletion || 0) >= 100;
  const nextLevel = isComplete ? await getNextAvailableCourseLevel(course) : null;

  return {
    course,
    progress,
    nextLesson,
    dueRevisions,
    revisionStats,
    recommendations,
    studyPlan,
    roadmapVersions,
    completion: {
      isComplete,
      nextLevel,
      enrollmentId: course.enrollment
    }
  };
};

export const getCurrentProgress = (userId) => buildCurrentProgressPayload(userId);

const advanceLearningPathIfNeeded = async ({ course, progress }) => {
  if (progress.overallCompletion < 100 || !course.enrollment) return null;

  const enrollment = await Enrollment.findById(course.enrollment).populate('learningPath');
  if (!enrollment || enrollment.type !== 'learning_path' || !enrollment.learningPath) return null;

  const entries = [...(enrollment.learningPath.courses || [])].sort((a, b) => a.order - b.order);
  const currentIndex = entries.findIndex((item) => item.course.toString() === course.course.toString());
  const nextEntry = currentIndex >= 0 ? entries[currentIndex + 1] : null;

  if (!nextEntry) {
    enrollment.status = 'completed';
    enrollment.onboardingState = ONBOARDING_STATES.COMPLETED;
    await enrollment.save();
    return { learningPathCompleted: true, nextPath: '/dashboard' };
  }

  course.status = 'archived';
  course.isActive = false;
  await course.save();

  enrollment.currentCourse = nextEntry.course;
  enrollment.level = nextEntry.defaultLevel || enrollment.level;
  enrollment.status = 'draft';
  enrollment.assessmentPreference = 'not_applicable';
  enrollment.assessmentChoiceAt = null;
  enrollment.onboardingState = ONBOARDING_STATES.ROADMAP_PENDING;
  enrollment.onboardingErrorCode = '';
  enrollment.onboardingErrorMessage = '';
  await enrollment.save();

  return { learningPathAdvanced: true, nextPath: '/onboarding/generating' };
};

export const markLessonComplete = async ({ userId, lessonId }) => {
  const course = await getActiveCourseForUser({ userId });
  if (!course) return null;

  assertLessonBelongsToCourse({ course, lessonId });

  const progress = await Progress.findOne({ user: userId, coursePlan: course._id });
  if (!progress) return null;

  const alreadyCompleted = progress.completedLessons.some((id) => id.toString() === lessonId);
  if (!alreadyCompleted) progress.completedLessons.push(lessonId);

  course.modules.forEach((module, moduleIndex) => {
    module.lessons.forEach((item) => {
      if (item.lesson.toString() === lessonId) item.status = 'completed';
    });

    const moduleCompleted = module.lessons.length > 0 && module.lessons.every((item) => item.status === 'completed');
    if (moduleCompleted) {
      module.status = 'completed';
      if (!progress.completedModules.includes(module._id.toString())) progress.completedModules.push(module._id.toString());
      const nextModule = course.modules[moduleIndex + 1];
      if (nextModule && nextModule.status === 'locked') {
        nextModule.status = 'available';
        nextModule.lessons.forEach((item) => {
          if (item.status === 'locked') item.status = 'available';
        });
      }
    } else if (module.lessons.some((item) => item.status === 'completed')) {
      module.status = 'in_progress';
    }
  });

  progress.lastStudiedAt = new Date();
  progress.overallCompletion = calculateCompletion(course, progress.completedLessons);
  await course.save();
  await progress.save();

  const pathResult = await advanceLearningPathIfNeeded({ course, progress });
  const isComplete = progress.overallCompletion >= 100;
  const nextLevel = isComplete && !pathResult
    ? await getNextAvailableCourseLevel(course)
    : null;

  return {
    progress,
    courseCompleted: isComplete,
    nextLevel,
    enrollmentId: course.enrollment,
    ...pathResult
  };
};

export const mergeWeakTopics = async ({ progress, weakTopics, source = 'quiz' }) => {
  for (const weak of weakTopics) {
    const existing = progress.weakTopics.find((item) => item.topic === weak.topic);
    let normalizedWeakTopic;

    if (existing) {
      existing.attempts += 1;
      existing.score = weak.score ?? existing.score;
      existing.source = source;
      existing.severity = getWeakTopicSeverity({ score: existing.score, attempts: existing.attempts });
      existing.lastDetectedAt = new Date();
      normalizedWeakTopic = existing;
    } else {
      const severity = getWeakTopicSeverity({ score: weak.score || 0, attempts: 1 });
      progress.weakTopics.push({
        topic: weak.topic,
        score: weak.score || 0,
        source,
        severity,
        attempts: 1,
        relatedLessons: weak.relatedLessons || []
      });
      normalizedWeakTopic = progress.weakTopics[progress.weakTopics.length - 1];
    }

    await scheduleRevisionForWeakTopic({
      userId: progress.user,
      coursePlanId: progress.coursePlan,
      weakTopic: normalizedWeakTopic,
      source
    });
  }
  await progress.save();
};
