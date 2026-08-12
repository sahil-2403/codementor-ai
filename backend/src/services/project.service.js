import { ProjectTask } from '../models/ProjectTask.js';
import { ProjectSubmission } from '../models/ProjectSubmission.js';
import { Progress } from '../models/Progress.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { checkAIUsageLimit, logAIUsage } from './aiUsage.service.js';
import { guardAIRequest, sanitizeCodeText } from './aiSafety.service.js';
import { projectReviewFallback } from './aiFallback.service.js';
import { mergeWeakTopics } from './progress.service.js';
import { requireActiveCourseForUser } from './dataIntegrity.service.js';
import { ApiError } from '../utils/ApiError.js';
import { createAttempt } from './attempt.service.js';
import { assertReviewCanStart } from '../domain/reviewPolicy.js';
import { env, isGeminiAvailable } from '../config/env.js';

const difficultyRank = { beginner: 1, intermediate: 2, advanced: 3 };
const allowedByLevel = (userLevel, difficulty) => difficultyRank[difficulty] <= difficultyRank[userLevel || 'beginner'];

const runBestEffort = async (label, action) => {
  try {
    await action();
  } catch (error) {
    console.error(`${label} failed:`, error.message);
  }
};

const getCurrentCourse = (userId) => requireActiveCourseForUser({ userId, lean: true });

export const listProjectTasks = async ({ userId, difficulty, tag }) => {
  const course = await getCurrentCourse(userId);
  const filter = { status: 'published', course: course.course };
  if (difficulty) filter.difficulty = difficulty;
  if (tag) filter.tags = tag;

  const tasks = await ProjectTask.find(filter)
    .populate('relatedLessons', 'title slug difficulty')
    .sort({ topicOrder: 1, difficulty: 1, createdAt: 1 })
    .lean();
  const submissions = await ProjectSubmission.find({
    user: userId,
    projectTask: { $in: tasks.map((task) => task._id) }
  }).sort({ createdAt: -1 }).lean();
  const byTask = new Map();

  submissions.forEach((submission) => {
    const key = submission.projectTask.toString();
    const list = byTask.get(key) || [];
    list.push(submission);
    byTask.set(key, list);
  });

  return tasks.map((task) => {
    const taskSubmissions = byTask.get(task._id.toString()) || [];
    const scored = taskSubmissions.filter((submission) => submission.reviewMode === 'ai' && typeof submission.score === 'number');
    const bestScore = scored.length ? Math.max(...scored.map((submission) => submission.score)) : null;
    const isLocked = !allowedByLevel(course.level || 'beginner', task.difficulty);
    return {
      ...task,
      isLocked,
      lockedReason: isLocked ? `Unlock this after reaching ${task.difficulty} level.` : '',
      attemptsUsed: taskSubmissions.length,
      maxAttempts: 2,
      bestScore,
      latestSubmission: taskSubmissions[0] || null
    };
  });
};

export const getProjectTask = async ({ taskId, userId }) => {
  const course = await getCurrentCourse(userId);
  const task = await ProjectTask.findOne({ _id: taskId, course: course.course, status: 'published' })
    .populate('relatedLessons', 'title slug difficulty topic')
    .lean();
  if (!task) throw new ApiError(404, 'Project task not found in your current course');

  const submissions = await ProjectSubmission.find({ user: userId, projectTask: taskId }).sort({ createdAt: -1 }).limit(5);
  const isLocked = !allowedByLevel(course.level || 'beginner', task.difficulty);
  return {
    task: {
      ...task,
      isLocked,
      lockedReason: isLocked ? `Unlock this after reaching ${task.difficulty} level.` : '',
      maxAttempts: 2
    },
    submissions,
    attemptsUsed: submissions.length,
    maxAttempts: 2
  };
};

export const submitProjectTask = async ({ userId, projectTaskId, taskId, submittedCode = '', submittedExplanation = '' }) => {
  const resolvedTaskId = projectTaskId || taskId;
  submittedCode = sanitizeCodeText(submittedCode, env.aiInputLimits.projectCodeChars);
  submittedExplanation = sanitizeCodeText(submittedExplanation, env.aiInputLimits.projectExplanationChars);

  const course = await getCurrentCourse(userId);
  const task = await ProjectTask.findOne({ _id: resolvedTaskId, course: course.course, status: 'published' });
  if (!task) throw new ApiError(404, 'Project task not found in your current course');
  if (!allowedByLevel(course.level || 'beginner', task.difficulty)) {
    throw new ApiError(403, 'This project is locked for your current level', [], 'CONTENT_LOCKED');
  }
  if (!submittedCode.trim() && !submittedExplanation.trim()) {
    throw new ApiError(400, 'Submit code or explanation for review');
  }

  return createAttempt({
    model: ProjectSubmission,
    identityFilter: { user: userId, projectTask: task._id },
    payload: {
      user: userId,
      projectTask: task._id,
      submittedCode,
      submittedExplanation,
      status: 'submitted',
      reviewMode: 'none'
    },
    limitMessage: 'You have used both submissions for this project task'
  });
};

export const reviewProjectSubmission = async ({ user, submissionId }) => {
  const submission = await ProjectSubmission.findOne({ _id: submissionId, user: user._id }).populate('projectTask');
  if (!submission) throw new ApiError(404, 'Project submission not found');

  const course = await requireActiveCourseForUser({ userId: user._id });
  if (submission.projectTask?.course?.toString() !== course.course.toString()) {
    throw new ApiError(403, 'This project submission belongs to a different course');
  }
  if (submission.status === 'reviewed') return submission;
  assertReviewCanStart({ status: submission.status, reviewRequestedAt: submission.reviewRequestedAt, label: 'This project submission' });

  submission.status = 'reviewing';
  submission.reviewRequestedAt = new Date();
  submission.reviewAttempts = (submission.reviewAttempts || 0) + 1;
  submission.reviewErrorCode = '';
  await submission.save();

  const aiConfigured = isGeminiAvailable();
  const progress = await Progress.findOne({ user: user._id, coursePlan: course._id });
  const guardText = `${submission.projectTask?.title || ''} ${submission.submittedExplanation || ''} ${submission.submittedCode || ''}`;
  let aiResult = null;
  let reviewError = null;

  try {
    if (aiConfigured) await checkAIUsageLimit(user._id, AI_FEATURES.PROJECT_REVIEW);
    await guardAIRequest({
      text: guardText,
      maxChars: env.aiInputLimits.projectCodeChars + env.aiInputLimits.projectExplanationChars
    });
    if (!aiConfigured) throw new Error('Gemini is not configured');

    aiResult = await aiProvider.reviewProjectSubmission({
      task: submission.projectTask,
      submission,
      userLevel: course.level || 'learner',
      weakTopics: progress?.weakTopics || []
    });
  } catch (error) {
    reviewError = error;
  }

  if (reviewError) {
    const fallback = projectReviewFallback({ task: submission.projectTask, submission });
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
    await runBestEffort('Project review logging', () => logAIUsage({
      user: user._id,
      feature: AI_FEATURES.PROJECT_REVIEW,
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
      await runBestEffort('Project weak-topic update', () => mergeWeakTopics({
        progress,
        weakTopics: submission.aiFeedback.weakTopicsDetected,
        source: 'project_submission'
      }));
    }

    await runBestEffort('Project review logging', () => logAIUsage({
      user: user._id,
      feature: AI_FEATURES.PROJECT_REVIEW,
      model: aiResult.model || env.geminiModel
    }));
  }

  return submission;
};

export const listMySubmissions = async ({ userId }) => {
  const course = await getCurrentCourse(userId);
  const taskIds = await ProjectTask.find({ course: course.course }).distinct('_id');
  return ProjectSubmission.find({ user: userId, projectTask: { $in: taskIds } })
    .populate('projectTask', 'title difficulty moduleTitle')
    .sort({ createdAt: -1 })
    .limit(50);
};
