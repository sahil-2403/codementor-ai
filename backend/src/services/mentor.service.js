import { MentorChat } from '../models/MentorChat.js';
import { Lesson } from '../models/Lesson.js';
import { Progress } from '../models/Progress.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { retrieveRelevantLearningContext } from '../ai/rag/rag.service.js';
import { checkAIUsageLimit, logAIUsage } from './aiUsage.service.js';
import { guardAIRequest, trimContextForAI } from './aiSafety.service.js';
import { mentorFallback } from './aiFallback.service.js';
import { invalidateUserLearningCache } from './cacheInvalidation.service.js';
import { assertLessonBelongsToCourse, requireActiveCourseForUser } from './dataIntegrity.service.js';
import { ApiError } from '../utils/ApiError.js';
import { env, isGeminiAvailable } from '../config/env.js';

const baseSuggestedPrompts = [
  { label: 'Explain simply', promptType: 'simple_explanation', text: 'Explain this concept in simple beginner-friendly language with one small example.' },
  { label: 'Real project example', promptType: 'real_project_example', text: 'Give me a real MERN project example where this concept is used.' },
  { label: 'Interview answer', promptType: 'interview_answer', text: 'Give me an interview-ready answer for this concept.' },
  { label: 'Practice question', promptType: 'practice_question', text: 'Give me one practice question and explain how I should solve it.' },
  { label: 'Explain my mistake', promptType: 'mistake_explanation', text: 'Explain the most common mistake learners make in this topic and how to avoid it.' },
  { label: 'Revision notes', promptType: 'revision_notes', text: 'Create concise revision notes for this topic.' }
];

const findCurrentModule = (course, lessonId) => {
  if (!course || !lessonId) return null;
  return course.modules?.find((module) => module.lessons?.some((item) => item.lesson?.toString() === lessonId.toString())) || null;
};

const findCourseLessonEntry = (module, lessonId) => module?.lessons?.find((item) => {
  const value = item.lesson?._id || item.lesson;
  return value?.toString() === lessonId?.toString();
}) || null;

const getAuthorizedMentorContext = async ({ userId, lessonId }) => {
  const course = await requireActiveCourseForUser({ userId });
  if (!lessonId) return { course, lesson: null, currentModule: null };

  assertLessonBelongsToCourse({ course, lessonId });
  const currentModule = findCurrentModule(course, lessonId);
  const courseLesson = findCourseLessonEntry(currentModule, lessonId);

  if (currentModule?.status === 'locked' || courseLesson?.status === 'locked') {
    throw new ApiError(403, 'This lesson is not available in your active roadmap.', [], 'CONTENT_LOCKED');
  }

  const lesson = await Lesson.findOne({ _id: lessonId, status: 'published' })
    .populate('topic', 'title slug category difficulty');

  if (!lesson) {
    throw new ApiError(404, 'This lesson is not available in your active roadmap.', [], 'LESSON_NOT_AVAILABLE');
  }

  return { course, lesson, currentModule };
};

const getRecentMistakes = async ({ userId, courseId }) => {
  if (!courseId) return [];
  const attempts = await QuizAttempt.find({ user: userId, coursePlan: courseId }).sort({ createdAt: -1 }).limit(3);
  return attempts.flatMap((attempt) => attempt.answers || []).filter((answer) => !answer.isCorrect).slice(0, 6).map((answer) => ({ topic: answer.topic, selectedAnswer: answer.selectedAnswer, correctAnswer: answer.correctAnswer, explanation: answer.explanation }));
};

export const isRealAIAvailable = () => isGeminiAvailable();

export const getMentorSuggestions = async ({ userId, lessonId }) => {
  const { course, lesson } = await getAuthorizedMentorContext({ userId, lessonId });
  const topic = lesson?.topic?.title || lesson?.title || course?.title || 'your current learning path';
  const curatedQuestions = [];
  if (lesson?.interviewQuestions?.length) {
    lesson.interviewQuestions.slice(0, 4).forEach((qa, index) => curatedQuestions.push({ label: qa.question || `Question ${index + 1}`, promptType: 'saved_answer', text: qa.question || `Explain ${topic}`, answer: qa.answer || lesson.interviewDefinition || lesson.theory || 'Review the lesson notes and write one small example.' }));
  }
  if (!curatedQuestions.length && lesson) {
    curatedQuestions.push({ label: `Explain ${topic}`, promptType: 'saved_answer', text: `Explain ${topic}`, answer: lesson.theory || lesson.interviewDefinition || 'Review the lesson content and practice with one small example.' });
    if (lesson.commonMistakes?.length) curatedQuestions.push({ label: 'Common mistakes', promptType: 'saved_answer', text: `Common mistakes in ${topic}`, answer: lesson.commonMistakes.join('\n') });
  }
  if (!curatedQuestions.length) curatedQuestions.push({ label: 'How should I study today?', promptType: 'saved_answer', text: 'How should I study today?', answer: 'Open your roadmap, continue the next available lesson, then complete one quiz or revision item. Use projects and interview mode after the core lesson is clear.' });
  return {
    aiAvailable: isRealAIAvailable(),
    prompts: baseSuggestedPrompts.map((item) => ({ ...item, text: item.text.replace('this concept', topic).replace('this topic', topic) })),
    savedQuestions: curatedQuestions
  };
};

export const askMentor = async ({ user, message, lessonId, promptType = 'freeform' }) => {
  const startedAt = Date.now();
  if (!isRealAIAvailable()) {
    const suggestions = await getMentorSuggestions({ userId: user._id, lessonId });
    return { answer: '', chat: null, sources: [], contextSummary: { aiAvailable: false }, suggestedPrompts: suggestions.prompts, savedQuestions: suggestions.savedQuestions, aiAvailable: false, message: 'Gemini mentor is currently unavailable. Use saved explanations from your course content.' };
  }

  await checkAIUsageLimit(user._id, AI_FEATURES.MENTOR_CHAT);
  const { sanitizedText, promptFingerprint } = await guardAIRequest({ userId: user._id, feature: AI_FEATURES.MENTOR_CHAT, text: message, metadata: { promptType, lessonId } });
  const { course, lesson, currentModule } = await getAuthorizedMentorContext({ userId: user._id, lessonId });
  const progress = await Progress.findOne({ user: user._id, coursePlan: course._id });
  const recentMistakes = await getRecentMistakes({ userId: user._id, courseId: course._id });
  const relatedContext = trimContextForAI(await retrieveRelevantLearningContext({ query: sanitizedText, lessonId, maxResults: 3 }));

  let aiResult;
  try {
    aiResult = await aiProvider.answerMentorQuestion({ question: sanitizedText, lesson, weakTopics: progress?.weakTopics || [], course, currentModule, recentMistakes, relatedContext, promptType });
  } catch (error) {
    aiResult = mentorFallback({ message: sanitizedText, lesson, relatedContext, weakTopics: progress?.weakTopics || [] });
    await logAIUsage({ user: user._id, feature: AI_FEATURES.MENTOR_CHAT, status: 'failed', model: env.geminiModel, provider: 'gemini', latencyMs: Date.now() - startedAt, promptFingerprint, contextSources: relatedContext.map((item) => item.source).filter(Boolean), metadata: { errorType: 'provider_failure', promptType }, errorMessage: error.message });
    const suggestions = await getMentorSuggestions({ userId: user._id, lessonId });
    return { answer: '', chat: null, sources: aiResult.sources || [], contextSummary: { aiAvailable: false }, suggestedPrompts: suggestions.prompts, savedQuestions: suggestions.savedQuestions, aiAvailable: false, message: aiResult.message || 'Gemini mentor is temporarily unavailable.' };
  }

  let chat = await MentorChat.findOne({ user: user._id, coursePlan: course._id });
  if (!chat) chat = await MentorChat.create({ user: user._id, coursePlan: course._id, lesson: lesson?._id || null, messages: [] });
  const sources = aiResult.sources || relatedContext.map((item) => item.source).filter(Boolean);
  const contextSummary = { level: course.level || null, moduleTitle: currentModule?.title || null, lessonTitle: lesson?.title || null, weakTopicCount: progress?.weakTopics?.length || 0, recentMistakeCount: recentMistakes.length, sourceCount: sources.length, promptType };
  chat.messages.push({ role: 'user', content: sanitizedText, lesson: lesson?._id || null, metadata: { promptType } });
  chat.messages.push({ role: 'assistant', content: aiResult.answer, lesson: lesson?._id || null, sources, metadata: contextSummary });
  await chat.save();
  await invalidateUserLearningCache(user._id);
  await logAIUsage({ user: user._id, feature: AI_FEATURES.MENTOR_CHAT, model: aiResult.model || env.geminiModel, provider: 'gemini', inputTokens: aiResult.inputTokens || 0, outputTokens: aiResult.outputTokens || 0, latencyMs: Date.now() - startedAt, promptFingerprint, contextSources: sources, metadata: contextSummary });
  const suggestionBundle = await getMentorSuggestions({ userId: user._id, lessonId });
  return { answer: aiResult.answer, chat, sources, contextSummary, suggestedPrompts: suggestionBundle.prompts, savedQuestions: suggestionBundle.savedQuestions, aiAvailable: true };
};

export const getMentorHistory = async (userId) => {
  const course = await requireActiveCourseForUser({ userId });
  return MentorChat.find({ user: userId, coursePlan: course._id }).sort({ updatedAt: -1 }).limit(1);
};
