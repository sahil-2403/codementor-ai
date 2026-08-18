import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getCurrentLevelModules, getCurrentProgress } from '../services/progress.service.js';
import { updateRevisionStatus } from '../services/revision.service.js';
import { Enrollment } from '../models/Enrollment.js';
import { ApiError } from '../utils/ApiError.js';

const referenceId = (value) => value?._id || value;

export const dashboard = asyncHandler(async (req, res) => {
  const data = await getCurrentProgress(req.user._id);
  if (!data) return sendResponse(res, 200, 'No active progress found', { course: null, progress: null, stats: null });

  const { course, progress, nextLesson, dueRevisions, revisionStats, recommendations, studyPlan, roadmapVersions } = data;
  const enrollment = await Enrollment.findById(course.enrollment).select('assessmentPreference').lean();
  const currentModules = getCurrentLevelModules(course);
  const currentLessonIds = new Set(
    currentModules
      .flatMap((module) => module.lessons || [])
      .map((item) => referenceId(item.lesson)?.toString())
      .filter(Boolean)
  );
  const completedCount = (progress.completedLessons || [])
    .filter((id) => currentLessonIds.has(id.toString()))
    .length;
  const criticalWeakTopics = (progress.weakTopics || []).filter((topic) => ['high', 'critical'].includes(topic.severity));
  const assessmentStatus = course.level === 'beginner'
    ? 'not_required'
    : enrollment?.assessmentPreference === 'take'
      ? 'completed'
      : 'skipped';
  const canPersonalizeLater = ['intermediate', 'advanced'].includes(course.level) &&
    enrollment?.assessmentPreference !== 'take';

  sendResponse(res, 200, 'Dashboard data', {
    course,
    progress,
    nextLesson,
    dueRevisions,
    revisionStats,
    recommendations,
    studyPlan,
    roadmapVersions,
    criticalWeakTopics,
    stats: {
      totalLessons: currentLessonIds.size,
      completedLessons: completedCount,
      overallCompletion: progress.overallCompletion,
      quizAccuracy: progress.quizStats.averageScore,
      weakTopicsCount: progress.weakTopics.length,
      criticalWeakTopicsCount: criticalWeakTopics.length,
      revisionsDue: dueRevisions.length,
      roadmapVersion: course.version || 1,
      streak: progress.streak,
      assessmentStatus,
      canPersonalizeLater
    }
  });
});

export const updateRevision = asyncHandler(async (req, res) => {
  const revision = await updateRevisionStatus({ userId: req.user._id, revisionId: req.params.revisionId, status: req.body.status });
  if (!revision) throw new ApiError(404, 'Revision item not found');
  sendResponse(res, 200, `Revision ${revision.status}`, { revision });
});
