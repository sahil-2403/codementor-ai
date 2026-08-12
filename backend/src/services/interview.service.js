import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { InterviewAttempt } from '../models/InterviewAttempt.js';
import { Progress } from '../models/Progress.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { checkAIUsageLimit, logAIUsage } from './aiUsage.service.js';
import { guardAIRequest } from './aiSafety.service.js';
import { interviewFeedbackFallback } from './aiFallback.service.js';
import { mergeWeakTopics } from './progress.service.js';
import { requireActiveCourseForUser } from './dataIntegrity.service.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/regex.js';
import { CACHE_TTL, getOrSetCache } from './cache.service.js';
import { cacheKeys } from './cacheKeys.service.js';
import { invalidateUserLearningCache } from './cacheInvalidation.service.js';
import { createAttempt } from './attempt.service.js';
import { assertReviewCanStart } from '../domain/reviewPolicy.js';
import { env, isGeminiAvailable } from '../config/env.js';

const publicQuestionProjection = '-expectedAnswer -answerChecklist';

const runBestEffort = async (label, action) => {
  try {
    await action();
  } catch (error) {
    console.error(`${label} failed:`, error.message);
  }
};

export const listInterviewQuestions = async ({ userId, topic, difficulty, type }) => {
  const course = await requireActiveCourseForUser({ userId, lean: true });
  const filter = { status: 'published', course: course.course };
  if (topic) filter.topic = new RegExp(escapeRegex(topic), 'i');
  if (difficulty) filter.difficulty = difficulty;
  if (type) filter.type = type;

  return getOrSetCache(
    cacheKeys.interviewQuestions(filter),
    () => InterviewQuestion.find(filter)
      .select(publicQuestionProjection)
      .sort({ topic: 1, difficulty: 1, createdAt: 1 })
      .limit(100)
      .lean(),
    CACHE_TTL.MEDIUM
  );
};

export const getInterviewQuestion = async ({ questionId, userId }) => {
  const course = await requireActiveCourseForUser({ userId, lean: true });
  const hasAttempted = await InterviewAttempt.exists({ user: userId, question: questionId });
  const query = InterviewQuestion.findOne({ _id: questionId, course: course.course, status: 'published' });
  if (!hasAttempted) query.select(publicQuestionProjection);
  const question = await query;
  if (!question) throw new ApiError(404, 'Interview question not found in your current course');
  return question;
};

const getFullInterviewQuestion = async ({ questionId, userId }) => {
  const course = await requireActiveCourseForUser({ userId, lean: true });
  const question = await InterviewQuestion.findOne({ _id: questionId, course: course.course, status: 'published' });
  if (!question) throw new ApiError(404, 'Interview question not found in your current course');
  return question;
};

export const saveInterviewAnswer = async ({ user, questionId, answer }) => {
  const question = await getFullInterviewQuestion({ questionId, userId: user._id });
  const { sanitizedText } = await guardAIRequest({
    text: answer,
    maxChars: env.aiInputLimits.interviewAnswerChars
  });

  const attempt = await createAttempt({
    model: InterviewAttempt,
    identityFilter: { user: user._id, question: question._id },
    payload: {
      user: user._id,
      question: question._id,
      answer: sanitizedText,
      status: 'submitted',
      feedbackMode: 'none'
    },
    limitMessage: 'You have used both attempts for this interview question'
  });

  await invalidateUserLearningCache(user._id);
  return attempt;
};

export const reviewInterviewAttempt = async ({ user, attemptId }) => {
  const attempt = await InterviewAttempt.findOne({ _id: attemptId, user: user._id }).populate('question');
  if (!attempt) throw new ApiError(404, 'Interview attempt not found');

  const course = await requireActiveCourseForUser({ userId: user._id });
  if (attempt.question?.course?.toString() !== course.course.toString()) {
    throw new ApiError(403, 'This interview attempt belongs to a different course');
  }
  if (attempt.status === 'reviewed') return attempt;
  assertReviewCanStart({ status: attempt.status, reviewRequestedAt: attempt.reviewRequestedAt, label: 'This interview attempt' });

  attempt.status = 'reviewing';
  attempt.reviewRequestedAt = new Date();
  attempt.reviewAttempts = (attempt.reviewAttempts || 0) + 1;
  attempt.reviewErrorCode = '';
  await attempt.save();

  const aiConfigured = isGeminiAvailable();
  const progress = await Progress.findOne({ user: user._id, coursePlan: course._id });
  let aiResult = null;
  let reviewError = null;

  try {
    if (aiConfigured) await checkAIUsageLimit(user._id, AI_FEATURES.INTERVIEW_FEEDBACK);
    await guardAIRequest({ text: attempt.answer, maxChars: env.aiInputLimits.interviewAnswerChars });
    if (!aiConfigured) throw new Error('Gemini is not configured');

    aiResult = await aiProvider.reviewInterviewAnswer({
      question: attempt.question,
      answer: attempt.answer,
      userLevel: course.level || 'learner'
    });
  } catch (error) {
    reviewError = error;
  }

  if (reviewError) {
    const fallback = interviewFeedbackFallback({ question: attempt.question });
    attempt.status = 'review_unavailable';
    attempt.feedbackMode = 'fallback';
    attempt.reviewedAt = null;
    attempt.reviewErrorCode = reviewError.code || 'GEMINI_UNAVAILABLE';
    attempt.score = null;
    attempt.aiFeedback = {
      summary: fallback.summary,
      expectedAnswer: attempt.question.expectedAnswer,
      strengths: fallback.strengths || [],
      improvements: fallback.improvements || [],
      weakTopicsDetected: [],
      generatedAt: new Date()
    };
    await attempt.save();
    await runBestEffort('Interview review logging', () => logAIUsage({
      user: user._id,
      feature: AI_FEATURES.INTERVIEW_FEEDBACK,
      status: 'failed',
      errorMessage: reviewError.message
    }));
  } else {
    attempt.status = 'reviewed';
    attempt.feedbackMode = 'ai';
    attempt.reviewedAt = new Date();
    attempt.reviewErrorCode = '';
    attempt.score = aiResult.score ?? null;
    attempt.aiFeedback = {
      summary: aiResult.summary,
      expectedAnswer: aiResult.expectedAnswer || attempt.question.expectedAnswer,
      strengths: aiResult.strengths || [],
      improvements: aiResult.improvements || [],
      weakTopicsDetected: aiResult.weakTopicsDetected || [],
      generatedAt: new Date()
    };
    await attempt.save();

    if (progress && attempt.aiFeedback.weakTopicsDetected.length) {
      await runBestEffort('Interview weak-topic update', () => mergeWeakTopics({
        progress,
        weakTopics: attempt.aiFeedback.weakTopicsDetected,
        source: 'interview_mode'
      }));
    }

    await runBestEffort('Interview review logging', () => logAIUsage({
      user: user._id,
      feature: AI_FEATURES.INTERVIEW_FEEDBACK,
      model: aiResult.model || env.geminiModel
    }));
  }

  await runBestEffort('Interview cache refresh', () => invalidateUserLearningCache(user._id));
  return attempt;
};

export const submitInterviewAnswer = async ({ user, questionId, answer }) => {
  const attempt = await saveInterviewAnswer({ user, questionId, answer });
  return reviewInterviewAttempt({ user, attemptId: attempt._id });
};

export const listInterviewAttempts = async ({ userId }) => {
  const course = await requireActiveCourseForUser({ userId, lean: true });
  const questionIds = await InterviewQuestion.find({ course: course.course }).distinct('_id');
  return InterviewAttempt.find({ user: userId, question: { $in: questionIds } })
    .populate('question')
    .sort({ createdAt: -1 })
    .limit(30);
};
