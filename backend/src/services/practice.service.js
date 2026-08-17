import { PracticeTask } from '../models/PracticeTask.js';
import { PracticeSubmission } from '../models/PracticeSubmission.js';
import { Progress } from '../models/Progress.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { checkAIUsageLimit, logAIUsage } from './aiUsage.service.js';
import { guardAIRequest, sanitizeCodeText } from './aiSafety.service.js';
import { practiceReviewFallback } from './aiFallback.service.js';
import { mergeWeakTopics } from './progress.service.js';
import { requireActiveCourseForUser } from './dataIntegrity.service.js';
import { ApiError } from '../utils/ApiError.js';
import { createAttempt } from './attempt.service.js';
import { assertReviewCanStart } from '../domain/reviewPolicy.js';
import { env, isGeminiAvailable } from '../config/env.js';

const difficultyRank = { beginner: 1, intermediate: 2, advanced: 3 };
const allowedByLevel = (userLevel, difficulty) => difficultyRank[difficulty] <= difficultyRank[userLevel || 'beginner'];
const referenceId = (value) => value?._id || value;

const getUnlockedLessonIds = (course) => new Set(
  (course.modules || [])
    .filter((module) => module.status !== 'locked')
    .flatMap((module) => (module.lessons || [])
      .filter((item) => item.status !== 'locked')
      .map((item) => referenceId(item.lesson)?.toString())
      .filter(Boolean))
);

const isPracticeTaskUnlocked = ({ course, task, unlockedLessonIds = getUnlockedLessonIds(course) }) => {
  const userLevel = course.level || 'beginner';
  if (!allowedByLevel(userLevel, task.difficulty)) return false;

  if (difficultyRank[task.difficulty] < difficultyRank[userLevel]) {
    return true;
  }

  const relatedLessonIds = (task.relatedLessons || []).map(referenceId).filter(Boolean);
  if (!relatedLessonIds.length) return true;
  return relatedLessonIds.some((id) => unlockedLessonIds.has(id.toString()));
};

const practiceLockedReason = 'Complete the earlier roadmap modules to unlock this practice task.';

const runBestEffort = async (label, action) => {
  try {
    await action();
  } catch (error) {
    console.error(`${label} failed:`, error.message);
  }
};

const getCurrentCourse = (userId) => requireActiveCourseForUser({ userId, lean: true });

export const listPracticeTasks = async ({ userId, difficulty, tag }) => {
  const course = await getCurrentCourse(userId);
  const filter = { status: 'published', course: course.course };
  if (difficulty) filter.difficulty = difficulty;
  if (tag) filter.tags = tag;

  const tasks = await PracticeTask.find(filter)
    .populate('relatedLessons', 'title slug difficulty')
    .sort({ topicOrder: 1, difficulty: 1, createdAt: 1 })
    .lean();
  const submissions = await PracticeSubmission.find({
    user: userId,
    practiceTask: { $in: tasks.map((task) => task._id) }
  }).sort({ createdAt: -1 }).lean();
  const byTask = new Map();
  const unlockedLessonIds = getUnlockedLessonIds(course);

  submissions.forEach((submission) => {
    const key = submission.practiceTask.toString();
    const list = byTask.get(key) || [];
    list.push(submission);
    byTask.set(key, list);
  });

  return tasks.map((task) => {
    const taskSubmissions = byTask.get(task._id.toString()) || [];
    const scored = taskSubmissions.filter((submission) => submission.reviewMode === 'ai' && typeof submission.score === 'number');
    const bestScore = scored.length ? Math.max(...scored.map((submission) => submission.score)) : null;
    const isLocked = !isPracticeTaskUnlocked({ course, task, unlockedLessonIds });
    return {
      ...task,
      isLocked,
      lockedReason: isLocked ? practiceLockedReason : '',
      attemptsUsed: taskSubmissions.length,
      maxAttempts: 2,
      bestScore,
      latestSubmission: taskSubmissions[0] || null
    };
  });
};

export const getPracticeTask = async ({ taskId, userId }) => {
  const course = await getCurrentCourse(userId);
  const task = await PracticeTask.findOne({ _id: taskId, course: course.course, status: 'published' })
    .populate('relatedLessons', 'title slug difficulty topic')
    .lean();
  if (!task) throw new ApiError(404, 'Practice task not found in your current course');

  const submissions = await PracticeSubmission.find({ user: userId, practiceTask: taskId }).sort({ createdAt: -1 }).limit(5);
  const isLocked = !isPracticeTaskUnlocked({ course, task });
  return {
    task: {
      ...task,
      isLocked,
      lockedReason: isLocked ? practiceLockedReason : '',
      maxAttempts: 2
    },
    submissions,
    attemptsUsed: submissions.length,
    maxAttempts: 2
  };
};

export const submitPracticeTask = async ({ userId, practiceTaskId, submittedCode = '', submittedExplanation = '' }) => {
  submittedCode = sanitizeCodeText(submittedCode, env.aiInputLimits.practiceCodeChars);
  submittedExplanation = sanitizeCodeText(submittedExplanation, env.aiInputLimits.practiceExplanationChars);

  const course = await getCurrentCourse(userId);
  const task = await PracticeTask.findOne({ _id: practiceTaskId, course: course.course, status: 'published' });
  if (!task) throw new ApiError(404, 'Practice task not found in your current course');
  if (!isPracticeTaskUnlocked({ course, task })) {
    throw new ApiError(403, practiceLockedReason, [], 'CONTENT_LOCKED');
  }
  if (!submittedCode.trim() && !submittedExplanation.trim()) {
    throw new ApiError(400, 'Submit code or explanation for review');
  }

  return createAttempt({
    model: PracticeSubmission,
    identityFilter: { user: userId, practiceTask: task._id },
    payload: {
      user: userId,
      practiceTask: task._id,
      submittedCode,
      submittedExplanation,
      status: 'submitted',
      reviewMode: 'none'
    },
    limitMessage: 'You have used both attempts for this practice task'
  });
};

export const reviewPracticeSubmission = async ({ user, submissionId }) => {
  const submission = await PracticeSubmission.findOne({ _id: submissionId, user: user._id }).populate('practiceTask');
  if (!submission) throw new ApiError(404, 'Practice submission not found');

  const course = await requireActiveCourseForUser({ userId: user._id });
  if (submission.practiceTask?.course?.toString() !== course.course.toString()) {
    throw new ApiError(403, 'This practice submission belongs to a different course');
  }
  if (submission.status === 'reviewed') return submission;
  assertReviewCanStart({ status: submission.status, reviewRequestedAt: submission.reviewRequestedAt, label: 'This practice submission' });

  submission.status = 'reviewing';
  submission.reviewRequestedAt = new Date();
  submission.reviewAttempts = (submission.reviewAttempts || 0) + 1;
  submission.reviewErrorCode = '';
  await submission.save();

  const aiConfigured = isGeminiAvailable();
  const progress = await Progress.findOne({ user: user._id, coursePlan: course._id });
  const guardText = `${submission.practiceTask?.title || ''} ${submission.submittedExplanation || ''} ${submission.submittedCode || ''}`;
  let aiResult = null;
  let reviewError = null;

  try {
    if (aiConfigured) await checkAIUsageLimit(user._id, AI_FEATURES.PRACTICE_REVIEW);
    await guardAIRequest({
      text: guardText,
      maxChars: env.aiInputLimits.practiceCodeChars + env.aiInputLimits.practiceExplanationChars
    });
    if (!aiConfigured) throw new Error('Gemini is not configured');

    aiResult = await aiProvider.reviewPracticeSubmission({
      task: submission.practiceTask,
      submission,
      userLevel: course.level || 'learner',
      weakTopics: progress?.weakTopics || []
    });
  } catch (error) {
    reviewError = error;
  }

  if (reviewError) {
    const fallback = practiceReviewFallback({ task: submission.practiceTask, submission });
    submission.status = 'review_unavailable';
    submission.reviewMode = 'fallback';
    submission.reviewedAt = null;
    submission.reviewErrorCode = reviewError.code || 'GEMINI_UNAVAILABLE';
    submission.score = null;
    submission.aiFeedback = {
      summary: fallback.summary,
      strengths: fallback.strengths || [],
      improvements: fallback.improvements || [],
      checklist: fallback.checklist || [],
      weakTopicsDetected: [],
      generatedAt: new Date()
    };
    await submission.save();
    await runBestEffort('Practice review logging', () => logAIUsage({
      user: user._id,
      feature: AI_FEATURES.PRACTICE_REVIEW,
      status: 'failed',
      errorMessage: reviewError.message
    }));
  } else {
    submission.status = 'reviewed';
    submission.reviewMode = 'ai';
    submission.reviewedAt = new Date();
    submission.reviewErrorCode = '';
    submission.score = aiResult.score ?? null;
    submission.aiFeedback = {
      summary: aiResult.summary,
      strengths: aiResult.strengths || [],
      improvements: aiResult.improvements || [],
      checklist: aiResult.checklist || [],
      weakTopicsDetected: aiResult.weakTopicsDetected || [],
      generatedAt: new Date()
    };
    await submission.save();

    if (progress && submission.aiFeedback.weakTopicsDetected.length) {
      await runBestEffort('Practice weak-topic update', () => mergeWeakTopics({
        progress,
        weakTopics: submission.aiFeedback.weakTopicsDetected,
        source: 'practice_submission'
      }));
    }

    await runBestEffort('Practice review logging', () => logAIUsage({
      user: user._id,
      feature: AI_FEATURES.PRACTICE_REVIEW,
      model: aiResult.model || env.geminiModel
    }));
  }

  return submission;
};

export const listMyPracticeSubmissions = async ({ userId }) => {
  const course = await getCurrentCourse(userId);
  const taskIds = await PracticeTask.find({ course: course.course }).distinct('_id');
  return PracticeSubmission.find({ user: userId, practiceTask: { $in: taskIds } })
    .populate('practiceTask', 'title difficulty moduleTitle')
    .sort({ createdAt: -1 })
    .limit(50);
};
