import { CoursePlan } from '../models/CoursePlan.js';
import { requireActiveCourseForUser, assertModuleBelongsToCourse, assertModuleUnlocked, assertQuestionsBelongToModule } from './dataIntegrity.service.js';
import { QuizQuestion } from '../models/QuizQuestion.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { Progress } from '../models/Progress.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { mergeWeakTopics } from './progress.service.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { retrieveRelevantLearningContext } from '../ai/rag/rag.service.js';
import { checkAIUsageLimit, createPromptFingerprint, logAIUsage } from './aiUsage.service.js';
import { trimContextForAI } from './aiSafety.service.js';
import { quizExplanationFallback } from './aiFallback.service.js';
import { ApiError } from '../utils/ApiError.js';
import { invalidateUserLearningCache } from './cacheInvalidation.service.js';
import { env, isGeminiAvailable } from '../config/env.js';

export const getQuizForModule = async ({ userId, moduleId }) => {
  const course = await requireActiveCourseForUser({ userId, populate: true });
  const module = assertModuleUnlocked(assertModuleBelongsToCourse({ course, moduleId }));
  return {
    courseId: course._id,
    moduleId,
    moduleTitle: module.title,
    questions: module.quizQuestions.map((question) => ({ _id: question._id, question: question.question, type: question.type, options: question.options, difficulty: question.difficulty }))
  };
};

export const submitQuiz = async ({ userId, moduleId, answers }) => {
  const course = await requireActiveCourseForUser({ userId });
  const module = assertModuleUnlocked(assertModuleBelongsToCourse({ course, moduleId }));
  const questionIds = answers.map((answer) => answer.questionId.toString());
  assertQuestionsBelongToModule({ module, questionIds, requireExactSet: true });

  const questions = await QuizQuestion.find({ _id: { $in: questionIds } }).populate('topic', 'title');
  if (questions.length !== questionIds.length) throw new ApiError(400, 'Some quiz questions were not found');
  const answerMap = new Map(answers.map((answer) => [answer.questionId.toString(), answer.selectedAnswer]));
  const checkedAnswers = questions.map((question) => {
    const selectedAnswer = answerMap.get(question._id.toString()) || '';
    return {
      question: question._id,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect: selectedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase(),
      explanation: question.explanation,
      topic: question.topic?.title || 'General'
    };
  });

  const correctCount = checkedAnswers.filter((answer) => answer.isCorrect).length;
  const score = Math.round((correctCount / Math.max(checkedAnswers.length, 1)) * 100);
  const wrongByTopic = new Map();
  checkedAnswers.filter((answer) => !answer.isCorrect).forEach((answer) => wrongByTopic.set(answer.topic, (wrongByTopic.get(answer.topic) || 0) + 1));
  const weakTopicsDetected = Array.from(wrongByTopic.entries()).map(([topic, count]) => ({ topic, score: Math.max(0, 100 - count * 30) }));
  const basicFeedback = weakTopicsDetected.length ? `Focus revision on: ${weakTopicsDetected.map((item) => item.topic).join(', ')}. Re-read related lessons and try another quiz.` : 'Good attempt. Continue to the next lesson and revise your notes once.';

  const attempt = await QuizAttempt.create({ user: userId, coursePlan: course._id, moduleId, answers: checkedAnswers, score, weakTopicsDetected, feedback: basicFeedback });
  const progress = await Progress.findOne({ user: userId, coursePlan: course._id });
  if (progress) {
    const totalAttempts = progress.quizStats.totalAttempts + 1;
    progress.quizStats.averageScore = Math.round(((progress.quizStats.averageScore * progress.quizStats.totalAttempts) + score) / totalAttempts);
    progress.quizStats.totalAttempts = totalAttempts;
    progress.quizStats.bestScore = Math.max(progress.quizStats.bestScore, score);
    await mergeWeakTopics({ progress, weakTopics: weakTopicsDetected, source: 'quiz' });
  }
  await invalidateUserLearningCache(userId);
  return attempt;
};

export const explainQuizAttempt = async ({ user, attemptId }) => {
  const startedAt = Date.now();
  const attempt = await QuizAttempt.findOne({ _id: attemptId, user: user._id }).populate('answers.question');
  if (!attempt) throw new ApiError(404, 'Quiz attempt not found');
  if (attempt.aiExplanation?.summary) return attempt;
  const aiConfigured = isGeminiAvailable();
  if (aiConfigured) await checkAIUsageLimit(user._id, AI_FEATURES.QUIZ_EXPLANATION);

  const course = await CoursePlan.findById(attempt.coursePlan);
  const wrongAnswers = (attempt.answers || []).filter((answer) => !answer.isCorrect);
  const relatedContext = trimContextForAI(await retrieveRelevantLearningContext({ query: wrongAnswers.map((answer) => `${answer.topic} ${answer.explanation}`).join(' '), maxResults: 4 }));
  const promptFingerprint = createPromptFingerprint(JSON.stringify({ attemptId, weakTopics: attempt.weakTopicsDetected, userId: user._id }));

  let aiResult;
  try {
    if (!aiConfigured) throw new Error('Gemini is not configured');
    aiResult = await aiProvider.explainQuizMistakes({ weakTopics: attempt.weakTopicsDetected, wrongAnswers, relatedContext, userLevel: course?.level || 'learner' });
  } catch (error) {
    aiResult = { ...quizExplanationFallback({ attempt, relatedContext }), aiAvailable: false };
    await logAIUsage({ user: user._id, feature: AI_FEATURES.QUIZ_EXPLANATION, status: 'failed', model: env.geminiModel, provider: 'gemini', latencyMs: Date.now() - startedAt, promptFingerprint, contextSources: relatedContext.map((item) => item.source).filter(Boolean), metadata: { attemptId, errorType: 'provider_failure' }, errorMessage: error.message });
  }

  attempt.aiExplanation = {
    summary: aiResult.feedback,
    focusTopics: aiResult.focusTopics || attempt.weakTopicsDetected.map((item) => item.topic),
    sources: aiResult.sources || relatedContext.map((item) => item.source).filter(Boolean),
    generatedAt: new Date(),
    aiAvailable: aiResult.aiAvailable !== false
  };
  await attempt.save();

  if (aiResult.aiAvailable !== false) {
    await logAIUsage({ user: user._id, feature: AI_FEATURES.QUIZ_EXPLANATION, model: aiResult.model || env.geminiModel, provider: 'gemini', inputTokens: aiResult.inputTokens || 0, outputTokens: aiResult.outputTokens || 0, latencyMs: Date.now() - startedAt, promptFingerprint, contextSources: attempt.aiExplanation.sources, metadata: { attemptId, score: attempt.score, wrongAnswerCount: wrongAnswers.length } });
  }
  return attempt;
};
