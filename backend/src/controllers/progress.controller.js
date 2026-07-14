import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getCurrentProgress } from '../services/progress.service.js';
import { updateRevisionStatus } from '../services/revision.service.js';
import { invalidateUserLearningCache } from '../services/cacheInvalidation.service.js';
import { ApiError } from '../utils/ApiError.js';

export const dashboard = asyncHandler(async (req, res) => {
  const data = await getCurrentProgress(req.user._id);
  if (!data) return sendResponse(res, 200, 'No active progress found', { course: null, progress: null, stats: null });

  const { course, progress, nextLesson, dueRevisions, revisionStats, recommendations, studyPlan, roadmapVersions } = data;
  const allLessons = course.modules.flatMap((module) => module.lessons.map((item) => item.lesson));
  const completedCount = progress.completedLessons.length;
  const criticalWeakTopics = (progress.weakTopics || []).filter((topic) => ['high', 'critical'].includes(topic.severity));

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
      totalLessons: allLessons.length,
      completedLessons: completedCount,
      overallCompletion: progress.overallCompletion,
      quizAccuracy: progress.quizStats.averageScore,
      weakTopicsCount: progress.weakTopics.length,
      criticalWeakTopicsCount: criticalWeakTopics.length,
      revisionsDue: dueRevisions.length,
      roadmapVersion: course.version || 1,
      streak: progress.streak,
      assessmentStatus: course.generatedReason === 'assessment_personalized' ? 'completed' : (course.level === 'beginner' ? 'not_required' : 'skipped'),
      canPersonalizeLater: ['intermediate', 'advanced'].includes(course.level) && course.generatedReason !== 'assessment_personalized'
    }
  });
});


export const updateRevision = asyncHandler(async (req, res) => {
  const revision = await updateRevisionStatus({ userId: req.user._id, revisionId: req.params.revisionId, status: req.body.status });
  if (!revision) throw new ApiError(404, 'Revision item not found');
  await invalidateUserLearningCache(req.user._id);
  sendResponse(res, 200, `Revision ${revision.status}`, { revision });
});
