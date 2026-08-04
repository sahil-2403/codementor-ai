import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../api/projectApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { STALE_TIMES } from '../constants/queryConfig.js';
import { invalidateMany } from './queryUtils.js';

export const useProjectTasks = (params = {}) => useQuery({
  queryKey: queryKeys.projectTasks(params),
  queryFn: () => projectApi.tasks(params),
  staleTime: STALE_TIMES.MEDIUM
});

export const useProjectTask = (taskId) => useQuery({
  queryKey: queryKeys.projectTask(taskId),
  queryFn: () => projectApi.task(taskId),
  enabled: Boolean(taskId),
  staleTime: STALE_TIMES.SHORT
});

export const useSubmitProjectTask = (taskId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectApi.submit,
    onSuccess: () => invalidateMany(queryClient, [queryKeys.projectTask(taskId), ['project-tasks']])
  });
};

export const useReviewProjectSubmission = (taskId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectApi.review,
    onSuccess: () => invalidateMany(queryClient, [queryKeys.projectTask(taskId), ['project-tasks'], queryKeys.dashboard])
  });
};
