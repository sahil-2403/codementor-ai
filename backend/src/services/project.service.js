import { ProjectTask } from '../models/ProjectTask.js';
import { ProjectSubmission } from '../models/ProjectSubmission.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Progress } from '../models/Progress.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { checkAIUsageLimit, logAIUsage } from './aiUsage.service.js';
import { guardAIRequest, sanitizeCodeText } from './aiSafety.service.js';
import { projectReviewFallback } from './aiFallback.service.js';
import { mergeWeakTopics } from './progress.service.js';
import { ApiError } from '../utils/ApiError.js';
import { invalidateUserLearningCache } from './cacheInvalidation.service.js';
import { env, isGeminiAvailable } from '../config/env.js';

const difficultyRank = { beginner: 1, intermediate: 2, advanced: 3 };
const allowedByLevel = (userLevel, difficulty) => difficultyRank[difficulty] <= difficultyRank[userLevel || 'beginner'];

export const listProjectTasks = async ({ userId, difficulty, tag }) => {
  const filter = { status: 'published' };
  if (difficulty) filter.difficulty = difficulty;
  if (tag) filter.tags = tag;

  const course = await CoursePlan.findOne({ user: userId, status: 'active', isActive: true }).lean();
  const userLevel = course?.level || 'beginner';
  const tasks = await ProjectTask.find(filter).populate('relatedLessons', 'title slug difficulty').sort({ topicOrder: 1, difficulty: 1, createdAt: 1 }).lean();
  const submissions = await ProjectSubmission.find({ user: userId, projectTask: { $in: tasks.map((task) => task._id) } }).sort({ createdAt: -1 }).lean();
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
    const isLocked = !allowedByLevel(userLevel, task.difficulty);
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
  const task = await ProjectTask.findOne({ _id: taskId, status: 'published' }).populate('relatedLessons', 'title slug difficulty topic').lean();
  if (!task) throw new ApiError(404, 'Project task not found');
  const course = await CoursePlan.findOne({ user: userId, status: 'active', isActive: true }).lean();
  const submissions = await ProjectSubmission.find({ user: userId, projectTask: taskId }).sort({ createdAt: -1 }).limit(5);
  const isLocked = !allowedByLevel(course?.level || 'beginner', task.difficulty);
  return { task: { ...task, isLocked, lockedReason: isLocked ? `Unlock this after reaching ${task.difficulty} level.` : '', maxAttempts: 2 }, submissions, attemptsUsed: submissions.length, maxAttempts: 2 };
};

export const submitProjectTask = async ({ userId, projectTaskId, taskId, submittedCode = '', submittedExplanation = '' }) => {
  const resolvedTaskId = projectTaskId || taskId;
  submittedCode = sanitizeCodeText(submittedCode, env.aiInputLimits.projectCodeChars);
  submittedExplanation = sanitizeCodeText(submittedExplanation, env.aiInputLimits.projectExplanationChars);
  const task = await ProjectTask.findOne({ _id: resolvedTaskId, status: 'published' });
  if (!task) throw new ApiError(404, 'Project task not found');
  const course = await CoursePlan.findOne({ user: userId, status: 'active', isActive: true }).lean();
  if (!allowedByLevel(course?.level || 'beginner', task.difficulty)) throw new ApiError(403, 'This project is locked for your current level', [], 'CONTENT_LOCKED');
  const attempts = await ProjectSubmission.countDocuments({ user: userId, projectTask: task._id });
  if (attempts >= 2) throw new ApiError(409, 'You have used both submissions for this project task', [], 'ATTEMPT_LIMIT_REACHED');
  if (!submittedCode.trim() && !submittedExplanation.trim()) throw new ApiError(400, 'Submit code or explanation for review');

  const submission = await ProjectSubmission.create({
    user: userId,
    projectTask: task._id,
    submittedCode,
    submittedExplanation,
    status: 'submitted',
    reviewMode: 'none'
  });
  await invalidateUserLearningCache(userId);
  return submission;
};

export const reviewProjectSubmission = async ({ user, submissionId }) => {
  const startedAt = Date.now();
  const submission = await ProjectSubmission.findOne({ _id: submissionId, user: user._id }).populate('projectTask');
  if (!submission) throw new ApiError(404, 'Project submission not found');
  if (submission.status === 'reviewed') return submission;
  if (submission.status === 'reviewing') throw new ApiError(409, 'This project submission is already being reviewed', [], 'REVIEW_IN_PROGRESS');

  submission.status = 'reviewing';
  submission.reviewRequestedAt = new Date();
  submission.reviewAttempts = (submission.reviewAttempts || 0) + 1;
  submission.reviewErrorCode = '';
  await submission.save();

  const aiConfigured = isGeminiAvailable();
  let promptFingerprint = '';
  let progress = null;

  try {
    if (aiConfigured) await checkAIUsageLimit(user._id, AI_FEATURES.PROJECT_REVIEW);

    const course = await CoursePlan.findOne({ user: user._id, status: 'active' });
    progress = course ? await Progress.findOne({ user: user._id, coursePlan: course._id }) : null;
    const guardText = `${submission.projectTask?.title || ''} ${submission.submittedExplanation || ''} ${submission.submittedCode || ''}`;
    const guarded = await guardAIRequest({ userId: user._id, feature: AI_FEATURES.PROJECT_REVIEW, text: guardText, maxChars: env.aiInputLimits.projectCodeChars + env.aiInputLimits.projectExplanationChars, metadata: { submissionId } });
    promptFingerprint = guarded.promptFingerprint;

    if (!aiConfigured) throw new Error('Gemini is not configured');
    const aiResult = await aiProvider.reviewProjectSubmission({
      task: submission.projectTask,
      submission,
      userLevel: course?.level || 'learner',
      weakTopics: progress?.weakTopics || []
    });

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
      await mergeWeakTopics({ progress, weakTopics: submission.aiFeedback.weakTopicsDetected, source: 'project_submission' });
    }

    await logAIUsage({ user: user._id, feature: AI_FEATURES.PROJECT_REVIEW, model: aiResult.model || env.geminiModel, provider: 'gemini', inputTokens: aiResult.inputTokens || 0, outputTokens: aiResult.outputTokens || 0, latencyMs: Date.now() - startedAt, promptFingerprint, contextSources: [{ type: 'project_task', title: submission.projectTask?.title, refId: submission.projectTask?._id?.toString() }], metadata: { submissionId, score: submission.score } });
  } catch (error) {
    const fallback = projectReviewFallback({ task: submission.projectTask, submission });
    submission.status = 'review_unavailable';
    submission.reviewMode = 'fallback';
    submission.reviewedAt = null;
    submission.reviewErrorCode = error.code || 'GEMINI_UNAVAILABLE';
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

    await logAIUsage({ user: user._id, feature: AI_FEATURES.PROJECT_REVIEW, status: 'failed', model: env.geminiModel, provider: 'gemini', latencyMs: Date.now() - startedAt, promptFingerprint, contextSources: [{ type: 'project_task', title: submission.projectTask?.title, refId: submission.projectTask?._id?.toString() }], metadata: { submissionId, errorType: 'provider_failure' }, errorMessage: error.message });
  }

  await invalidateUserLearningCache(user._id);
  return submission;
};

export const listMySubmissions = async ({ userId }) => ProjectSubmission.find({ user: userId }).populate('projectTask', 'title difficulty moduleTitle').sort({ createdAt: -1 }).limit(50);
