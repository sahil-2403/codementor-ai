import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewApi } from '../api/interviewApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { STALE_TIMES } from '../constants/queryConfig.js';
import { invalidateMany } from './queryUtils.js';

export const useInterviewQuestions = (params = {}) => useQuery({ queryKey: queryKeys.interviewQuestions(params), queryFn: () => interviewApi.questions(params), staleTime: STALE_TIMES.MEDIUM });
export const useInterviewAttempts = () => useQuery({ queryKey: queryKeys.interviewAttempts, queryFn: interviewApi.attempts });
export const useSubmitInterviewAnswer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: interviewApi.submit,
    onSuccess: () => invalidateMany(queryClient, [queryKeys.interviewAttempts, queryKeys.dashboard])
  });
};
