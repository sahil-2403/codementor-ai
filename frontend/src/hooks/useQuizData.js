import { quizApi } from '../api/quizApi.js';
import { useAsyncAction } from './useAsyncAction.js';
import { useAsyncData } from './useAsyncData.js';

export const useModuleQuiz = (moduleId) => useAsyncData(
  () => quizApi.moduleQuiz(moduleId),
  [moduleId],
  { enabled: Boolean(moduleId) }
);

export const useQuizAttempt = (attemptId) => useAsyncData(
  () => quizApi.attempt(attemptId),
  [attemptId],
  { enabled: Boolean(attemptId) }
);

export const useSubmitQuiz = () => useAsyncAction(quizApi.submit);
export const useExplainQuizAttempt = (attemptId) => useAsyncAction(() => quizApi.explainAttempt(attemptId));
