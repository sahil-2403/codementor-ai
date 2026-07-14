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

export const listInterviewQuestions = async ({ topic, difficulty, type }) => {
  const filter = { status: 'published' };
  if (topic) filter.topic = new RegExp(topic, 'i');
  if (difficulty) filter.difficulty = difficulty;
  if (type) filter.type = type;
  return getOrSetCache(cacheKeys.interviewQuestions(filter), () => InterviewQuestion.find(filter).sort({ topic: 1, difficulty: 1, createdAt: 1 }).limit(100).lean(), CACHE_TTL.MEDIUM);
};

export const getInterviewQuestion = async (questionId) => {
  const question = await InterviewQuestion.findOne({ _id: questionId, status: 'published' });
  if (!question) throw new ApiError(404, 'Interview question not found');
  return question;
};

export const submitInterviewAnswer = async ({ user, questionId, answer }) => {
  const startedAt = Date.now();
  const question = await getInterviewQuestion(questionId);
  const attemptCount = await InterviewAttempt.countDocuments({ user: user._id, question: question._id });
  if (attemptCount >= 2) throw new ApiError(429, 'You have used both attempts for this interview question');
  const aiConfigured = process.env.ENABLE_AI === 'true' && (process.env.AI_PROVIDER || 'mock') !== 'mock';
  if (aiConfigured) await checkAIUsageLimit(user._id, AI_FEATURES.INTERVIEW_FEEDBACK);

  const course = await CoursePlan.findOne({ user: user._id, status: 'active' });
  const progress = course ? await Progress.findOne({ user: user._id, coursePlan: course._id }) : null;
  const { sanitizedText, promptFingerprint } = await guardAIRequest({ userId: user._id, feature: AI_FEATURES.INTERVIEW_FEEDBACK, text: answer, maxChars: Number(process.env.MAX_INTERVIEW_ANSWER_CHARS || 3000), metadata: { questionId } });

  let aiResult;
  try {
    if (!aiConfigured) throw new Error('AI provider is not configured');
    aiResult = await aiProvider.reviewInterviewAnswer({ question, answer: sanitizedText, userLevel: course?.level || 'learner' });
  } catch (error) {
    aiResult = interviewFeedbackFallback({ question });
    aiResult.aiAvailable = false;
    await logAIUsage({ user: user._id, feature: AI_FEATURES.INTERVIEW_FEEDBACK, status: 'failed', model: process.env.AI_PROVIDER || 'mock', provider: process.env.AI_PROVIDER || 'mock', latencyMs: Date.now() - startedAt, promptFingerprint, contextSources: [{ type: 'interview_question', title: question.topic, refId: question._id.toString() }], metadata: { questionId, errorType: 'provider_failure' }, errorMessage: error.message });
  }

  const attempt = await InterviewAttempt.create({
    user: user._id,
    question: question._id,
    answer: sanitizedText,
    feedbackMode: aiResult.aiAvailable === false ? 'fallback' : 'ai',
    score: aiResult.aiAvailable === false ? null : (aiResult.score || 0),
    aiFeedback: {
      summary: aiResult.summary,
      expectedAnswer: aiResult.expectedAnswer || question.expectedAnswer,
      strengths: aiResult.strengths || [],
      improvements: aiResult.improvements || [],
      weakTopicsDetected: aiResult.weakTopicsDetected || [],
      generatedAt: new Date()
    }
  });

  if (progress && attempt.aiFeedback.weakTopicsDetected.length) {
    await mergeWeakTopics({ progress, weakTopics: attempt.aiFeedback.weakTopicsDetected, source: 'interview_mode' });
  }
  await invalidateUserLearningCache(user._id);

  await logAIUsage({
    user: user._id,
    feature: AI_FEATURES.INTERVIEW_FEEDBACK,
    model: aiResult.model || 'mock',
    provider: aiResult.provider || process.env.AI_PROVIDER || 'mock',
    inputTokens: aiResult.inputTokens || 0,
    outputTokens: aiResult.outputTokens || 0,
    estimatedCost: aiResult.estimatedCost || 0,
    latencyMs: Date.now() - startedAt,
    promptFingerprint,
    contextSources: [{ type: 'interview_question', title: question.topic, refId: question._id.toString() }],
    metadata: { questionId, score: attempt.score, feedbackMode: attempt.feedbackMode }
  });

  return attempt.populate('question');
};

export const listInterviewAttempts = async ({ userId }) => {
  return InterviewAttempt.find({ user: userId }).populate('question').sort({ createdAt: -1 }).limit(30);
};
