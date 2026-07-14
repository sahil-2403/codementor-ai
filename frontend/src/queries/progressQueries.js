import { useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '../api/progressApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { invalidateMany } from './queryUtils.js';
export { useDashboard } from './dashboardQueries.js';

export const useUpdateRevision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: progressApi.updateRevision,
    onSuccess: () => invalidateMany(queryClient, [queryKeys.dashboard])
  });
};
