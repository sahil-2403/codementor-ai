import { Progress } from '../models/Progress.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { getWeakTopicSeverity, getNextLessonFromCourse, buildLearningRecommendations, buildStudyPlan } from './recommendation.service.js';
import { scheduleRevisionForWeakTopic, getDueRevisions, getRevisionStats } from './revision.service.js';
import { CACHE_TTL, getOrSetCache } from './cache.service.js';
import { cacheKeys } from './cacheKeys.service.js';
import { invalidateUserLearningCache } from './cacheInvalidation.service.js';
import { assertLessonBelongsToCourse, getActiveCourseForUser } from './dataIntegrity.service.js';

const calculateCompletion = (course, completedLessonIds) => {
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  if (!totalLessons) return 0;
  return Math.round((completedLessonIds.length / totalLessons) * 100);
};

export const createProgressForCourse = async ({ userId, coursePlanId, session = null } = {}) => {
  await invalidateUserLearningCache(userId);
  const query = Progress.findOneAndUpdate(
    { user: userId, coursePlan: coursePlanId },
    { $setOnInsert: { user: userId, coursePlan: coursePlanId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  if (session) query.session(session);
  return query;
};

const buildCurrentProgressPayload = async (userId) => {
  const course = await CoursePlan.findOne({ user: userId, status: 'active', isActive: true })
    .populate('modules.lessons.lesson')
    .sort({ createdAt: -1 })
    .lean();
  if (!course) return null;

  const [progress, dueRevisions, revisionStats, roadmapVersions] = await Promise.all([
    Progress.findOne({ user: userId, coursePlan: course._id }).lean(),
    getDueRevisions({ userId, coursePlanId: course._id }),
    getRevisionStats({ userId, coursePlanId: course._id }),
    CoursePlan.find({ user: userId }).select('_id title version roadmapType generatedReason status isActive createdAt').sort({ version: -1 }).lean()
  ]);

  const nextLesson = getNextLessonFromCourse(course);
  const recommendations = buildLearningRecommendations({ course, progress, dueRevisions });
  const studyPlan = buildStudyPlan({ nextLesson, dueRevisions, progress });

  return { course, progress, nextLesson, dueRevisions, revisionStats, recommendations, studyPlan, roadmapVersions };
};

export const getCurrentProgress = async (userId) => {
  return getOrSetCache(cacheKeys.dashboard(userId), () => buildCurrentProgressPayload(userId), CACHE_TTL.SHORT);
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
  await invalidateUserLearningCache(userId);
  return progress;
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
  await invalidateUserLearningCache(progress.user);
};
