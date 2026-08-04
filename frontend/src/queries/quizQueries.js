import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../api/quizApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { invalidateMany } from './queryUtils.js';

export const useModuleQuiz = (moduleId) => useQuery({ queryKey: queryKeys.quiz(moduleId), queryFn: () => quizApi.moduleQuiz(moduleId), enabled: Boolean(moduleId) });
export const useQuizAttempt = (attemptId) => useQuery({ queryKey: queryKeys.quizAttempt(attemptId), queryFn: () => quizApi.attempt(attemptId), enabled: Boolean(attemptId) });
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quizApi.submit,
    onSuccess: () => invalidateMany(queryClient, [queryKeys.dashboard, queryKeys.roadmap])
  });
};
export const useExplainQuizAttempt = (attemptId) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => quizApi.explainAttempt(attemptId), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quizAttempt(attemptId) }) });
};
