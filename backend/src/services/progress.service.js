import { Progress } from '../models/Progress.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Lesson } from '../models/Lesson.js';
import { getWeakTopicSeverity, getNextLessonFromCourse, buildLearningRecommendations, buildStudyPlan } from './recommendation.service.js';
import { scheduleRevisionForWeakTopic, getDueRevisions, getRevisionStats } from './revision.service.js';
import { assertLessonBelongsToCourse, getActiveCourseForUser } from './dataIntegrity.service.js';
import { findRelevantLessons } from './learningContext.service.js';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';

const levelOrder = ['beginner', 'intermediate', 'advanced'];
const referenceId = (value) => value?._id || value;
const referenceString = (value) => referenceId(value)?.toString?.() || '';
const moduleLevel = (course, module) => module.level || course.level;

export const getCurrentLevelModules = (course) => (course?.modules || [])
  .filter((module) => moduleLevel(course, module) === course.level);

const getCurrentLevelLessonIds = (course) => new Set(
  getCurrentLevelModules(course)
    .flatMap((module) => module.lessons || [])
    .map((item) => referenceString(item.lesson))
    .filter(Boolean)
);

const calculateCompletion = (course, completedLessonIds) => {
  const currentLessonIds = getCurrentLevelLessonIds(course);
  if (!currentLessonIds.size) return 0;
  const completedSet = new Set(completedLessonIds.map((id) => id.toString()));
  const completedCurrent = [...currentLessonIds].filter((id) => completedSet.has(id)).length;
  return Math.round((completedCurrent / currentLessonIds.size) * 100);
};

const applyCourseProgressState = ({ course, progress }) => {
  const completedSet = new Set((progress.completedLessons || []).map((id) => id.toString()));
  let foundCurrentIncomplete = false;

  course.modules.forEach((module) => {
    const level = moduleLevel(course, module);
    const isCurrentLevel = level === course.level;
    const lessons = module.lessons || [];

    lessons.forEach((item) => {
      const completed = completedSet.has(referenceString(item.lesson));
      if (completed) item.status = 'completed';
      else if (!isCurrentLevel) item.status = 'available';
    });

    const completedCount = lessons.filter((item) => item.status === 'completed').length;
    const moduleCompleted = lessons.length > 0 && completedCount === lessons.length;

    if (!isCurrentLevel) {
      module.status = moduleCompleted
        ? 'completed'
        : completedCount > 0
          ? 'in_progress'
          : 'available';
      return;
    }

    if (moduleCompleted) {
      module.status = 'completed';
      return;
    }

    if (!foundCurrentIncomplete) {
      module.status = completedCount > 0 ? 'in_progress' : 'available';
      lessons.forEach((item) => {
        if (item.status !== 'completed') item.status = 'available';
      });
      foundCurrentIncomplete = true;
      return;
    }

    module.status = 'locked';
    lessons.forEach((item) => {
      if (item.status !== 'completed') item.status = 'locked';
    });
  });

  progress.completedModules = course.modules
    .filter((module) => (module.lessons || []).length > 0 && (module.lessons || []).every((item) => item.status === 'completed'))
    .map((module) => module._id.toString());
  progress.overallCompletion = calculateCompletion(course, progress.completedLessons || []);
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

export const carryProgressToCourse = async ({ userId, previousCoursePlanId, coursePlanId }) => {
  const [course, progress, previousProgress] = await Promise.all([
    CoursePlan.findOne({ _id: coursePlanId, user: userId }),
    createProgressForCourse({ userId, coursePlanId }),
    previousCoursePlanId
      ? Progress.findOne({ user: userId, coursePlan: previousCoursePlanId }).lean()
      : null
  ]);

  if (!course || !progress) return progress;

  if (previousProgress) {
    const roadmapLessonIds = new Set(
      course.modules
        .flatMap((module) => module.lessons || [])
        .map((item) => referenceString(item.lesson))
        .filter(Boolean)
    );

    progress.completedLessons = (previousProgress.completedLessons || [])
      .filter((id) => roadmapLessonIds.has(id.toString()));
    progress.lastStudiedAt = previousProgress.lastStudiedAt || progress.lastStudiedAt;
  }

  applyCourseProgressState({ course, progress });
  await course.save();
  await progress.save();
  return progress;
};

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

  applyCourseProgressState({ course, progress });
  progress.lastStudiedAt = new Date();
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

const resolveRelatedLessons = async ({ course, roadmapLessonIds, weak }) => {
  const supplied = (weak.relatedLessons || [])
    .map(referenceId)
    .filter((id) => id && roadmapLessonIds.has(id.toString()));
  if (supplied.length) return supplied.slice(0, 3);

  const topicRef = referenceId(weak.topicRef);
  if (topicRef) {
    const topicLessons = await Lesson.find({
      course: course.course,
      topic: topicRef,
      status: 'published'
    }).select('_id').limit(5).lean();

    const matchingLessonIds = topicLessons
      .map((lesson) => lesson._id)
      .filter((id) => roadmapLessonIds.has(id.toString()))
      .slice(0, 3);
    if (matchingLessonIds.length) return matchingLessonIds;
  }

  const matches = await findRelevantLessons({
    query: weak.topic,
    courseId: course.course,
    maxResults: 5
  });

  return matches
    .map((item) => item.lesson?._id)
    .filter((id) => id && roadmapLessonIds.has(id.toString()))
    .slice(0, 3);
};

export const mergeWeakTopics = async ({ progress, weakTopics, source = 'quiz' }) => {
  const course = await CoursePlan.findById(progress.coursePlan)
    .select('course modules.lessons.lesson')
    .lean();
  const roadmapLessonIds = new Set(
    (course?.modules || [])
      .flatMap((module) => module.lessons || [])
      .map((item) => referenceString(item.lesson))
      .filter(Boolean)
  );

  for (const weak of weakTopics) {
    const relatedLessons = course
      ? await resolveRelatedLessons({ course, roadmapLessonIds, weak })
      : [];
    const weakTopicRef = referenceId(weak.topicRef);
    const existing = progress.weakTopics.find((item) => (
      weakTopicRef
        ? referenceString(item.topicRef) === weakTopicRef.toString()
        : item.topic === weak.topic
    ));
    let normalizedWeakTopic;

    if (existing) {
      existing.attempts += 1;
      existing.score = weak.score ?? existing.score;
      existing.source = source;
      existing.severity = getWeakTopicSeverity({ score: existing.score, attempts: existing.attempts });
      existing.lastDetectedAt = new Date();
      if (weakTopicRef) existing.topicRef = weakTopicRef;
      if (relatedLessons.length) existing.relatedLessons = relatedLessons;
      normalizedWeakTopic = existing;
    } else {
      const severity = getWeakTopicSeverity({ score: weak.score || 0, attempts: 1 });
      progress.weakTopics.push({
        topic: weak.topic,
        topicRef: weakTopicRef || null,
        score: weak.score || 0,
        source,
        severity,
        attempts: 1,
        relatedLessons
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
