import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lessonApi } from '../api/lessonApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { STALE_TIMES } from '../constants/queryConfig.js';
import { invalidateMany } from './queryUtils.js';
export const useLesson = (lessonId) => useQuery({ queryKey: queryKeys.lesson(lessonId), queryFn: () => lessonApi.get(lessonId), enabled: Boolean(lessonId), staleTime: STALE_TIMES.LONG });
export const useCompleteLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lessonApi.complete,
    onSuccess: (_data, lessonId) => invalidateMany(queryClient, [queryKeys.dashboard, queryKeys.roadmap, queryKeys.lesson(lessonId)])
  });
};
