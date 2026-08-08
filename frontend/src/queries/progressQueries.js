import { useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '../api/progressApi.js';
import { queryKeys } from '../constants/queryKeys.js';
export { useDashboard } from './dashboardQueries.js';

export const useUpdateRevision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: progressApi.updateRevision,
    onMutate: async ({ revisionId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard });
      const previousDashboard = queryClient.getQueryData(queryKeys.dashboard);

      queryClient.setQueryData(queryKeys.dashboard, (current) => {
        if (!current) return current;

        const dueRevisions = (current.dueRevisions || []).filter(
          (item) => item._id !== revisionId
        );
        const pending = Math.max(
          0,
          Number(current.revisionStats?.pending || 0) - 1
        );
        const completed =
          status === 'completed'
            ? Number(current.revisionStats?.completed || 0) + 1
            : Number(current.revisionStats?.completed || 0);

        return {
          ...current,
          dueRevisions,
          revisionStats: {
            ...current.revisionStats,
            pending,
            completed
          },
          stats: {
            ...current.stats,
            revisionsDue: dueRevisions.length
          }
        };
      });

      return { previousDashboard };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard, context.previousDashboard);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
  });
};
