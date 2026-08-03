import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { InterviewAttempt } from '../models/InterviewAttempt.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Progress } from '../models/Progress.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { checkAIUsageLimit, logAIUsage } from './aiUsage.service.js';
import { guardAIRequest } from './aiSafety.service.js';
import { interviewFeedbackFallback } from './aiFallback.service.js';
import { mergeWeakTopics } from './progress.service.js';
import { ApiError } from '../utils/ApiError.js';
import { CACHE_TTL, getOrSetCache } from './cache.service.js';
import { cacheKeys } from './cacheKeys.service.js';
import { invalidateUserLearningCache } from './cacheInvalidation.service.js';
import { env, isGeminiAvailable } from '../config/env.js';

const publicQuestionProjection = '-expectedAnswer -answerChecklist';

export const listInterviewQuestions = async ({ topic, difficulty, type }) => {
  const filter = { status: 'published' };
  if (topic) filter.topic = new RegExp(topic, 'i');
  if (difficulty) filter.difficulty = difficulty;
  if (type) filter.type = type;
  return getOrSetCache(
    cacheKeys.interviewQuestions(filter),
    () => InterviewQuestion.find(filter).select(publicQuestionProjection).sort({ topic: 1, difficulty: 1, createdAt: 1 }).limit(100).lean(),
    CACHE_TTL.MEDIUM
  );
};

export const getInterviewQuestion = async ({ questionId, userId }) => {
  const hasAttempted = await InterviewAttempt.exists({ user: userId, question: questionId });
  const query = InterviewQuestion.findOne({ _id: questionId, status: 'published' });
  if (!hasAttempted) query.select(publicQuestionProjection);
  const question = await query;
  if (!question) throw new ApiError(404, 'Interview question not found');
  return question;
};

const getFullInterviewQuestion = async (questionId) => {
  const question = await InterviewQuestion.findOne({ _id: questionId, status: 'published' });
  if (!question) throw new ApiError(404, 'Interview question not found');
  return question;
};

export const saveInterviewAnswer = async ({ user, questionId, answer }) => {
  const question = await getFullInterviewQuestion(questionId);
  const attemptCount = await InterviewAttempt.countDocuments({ user: user._id, question: question._id });
  if (attemptCount >= 2) throw new ApiError(409, 'You have used both attempts for this interview question', [], 'ATTEMPT_LIMIT_REACHED');

  const { sanitizedText } = await guardAIRequest({
    userId: user._id,
    feature: AI_FEATURES.INTERVIEW_FEEDBACK,
    text: answer,
    maxChars: env.aiInputLimits.interviewAnswerChars,
    metadata: { questionId }
  });

  const attempt = await InterviewAttempt.create({
    user: user._id,
    question: question._id,
    answer: sanitizedText,
    status: 'submitted',
    feedbackMode: 'none'
  });

  await invalidateUserLearningCache(user._id);
  return attempt;
};

export const reviewInterviewAttempt = async ({ user, attemptId }) => {
  const startedAt = Date.now();
  const attempt = await InterviewAttempt.findOne({ _id: attemptId, user: user._id }).populate('question');
  if (!attempt) throw new ApiError(404, 'Interview attempt not found');
  if (attempt.status === 'reviewed') return attempt;
  if (attempt.status === 'reviewing') throw new ApiError(409, 'This interview attempt is already being reviewed', [], 'REVIEW_IN_PROGRESS');

  attempt.status = 'reviewing';
  attempt.reviewRequestedAt = new Date();
  attempt.reviewAttempts = (attempt.reviewAttempts || 0) + 1;
  attempt.reviewErrorCode = '';
  await attempt.save();

  const aiConfigured = isGeminiAvailable();
  let promptFingerprint = '';
  let progress = null;

  try {
    if (aiConfigured) await checkAIUsageLimit(user._id, AI_FEATURES.INTERVIEW_FEEDBACK);

    const course = await CoursePlan.findOne({ user: user._id, status: 'active' });
    progress = course ? await Progress.findOne({ user: user._id, coursePlan: course._id }) : null;
    const guarded = await guardAIRequest({
      userId: user._id,
      feature: AI_FEATURES.INTERVIEW_FEEDBACK,
      text: attempt.answer,
      maxChars: env.aiInputLimits.interviewAnswerChars,
      metadata: { questionId: attempt.question._id, attemptId }
    });
    promptFingerprint = guarded.promptFingerprint;

    if (!aiConfigured) throw new Error('Gemini is not configured');
    const aiResult = await aiProvider.reviewInterviewAnswer({
      question: attempt.question,
      answer: attempt.answer,
      userLevel: course?.level || 'learner'
    });

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
      await mergeWeakTopics({ progress, weakTopics: attempt.aiFeedback.weakTopicsDetected, source: 'interview_mode' });
    }

    await logAIUsage({ user: user._id, feature: AI_FEATURES.INTERVIEW_FEEDBACK, model: aiResult.model || env.geminiModel, provider: 'gemini', inputTokens: aiResult.inputTokens || 0, outputTokens: aiResult.outputTokens || 0, latencyMs: Date.now() - startedAt, promptFingerprint, contextSources: [{ type: 'interview_question', title: attempt.question.topic, refId: attempt.question._id.toString() }], metadata: { attemptId, questionId: attempt.question._id, score: attempt.score, feedbackMode: attempt.feedbackMode } });
  } catch (error) {
    const fallback = interviewFeedbackFallback({ question: attempt.question });
    attempt.status = 'review_unavailable';
    attempt.feedbackMode = 'fallback';
    attempt.reviewedAt = null;
    attempt.reviewErrorCode = error.code || 'GEMINI_UNAVAILABLE';
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

    await logAIUsage({ user: user._id, feature: AI_FEATURES.INTERVIEW_FEEDBACK, status: 'failed', model: env.geminiModel, provider: 'gemini', latencyMs: Date.now() - startedAt, promptFingerprint, contextSources: [{ type: 'interview_question', title: attempt.question.topic, refId: attempt.question._id.toString() }], metadata: { attemptId, questionId: attempt.question._id, errorType: 'provider_failure' }, errorMessage: error.message });
  }

  await invalidateUserLearningCache(user._id);
  return attempt;
};

export const submitInterviewAnswer = async ({ user, questionId, answer }) => {
  const attempt = await saveInterviewAnswer({ user, questionId, answer });
  return reviewInterviewAttempt({ user, attemptId: attempt._id });
};

export const listInterviewAttempts = async ({ userId }) => InterviewAttempt.find({ user: userId }).populate('question').sort({ createdAt: -1 }).limit(30);
