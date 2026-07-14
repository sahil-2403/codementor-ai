import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi.js';
import { queryKeys } from '../constants/queryKeys.js';
export const useReports = () => useQuery({ queryKey: queryKeys.reports, queryFn: reportApi.list });
export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: reportApi.generate, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reports }) });
};
