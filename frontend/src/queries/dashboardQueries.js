import { useQuery } from '@tanstack/react-query';
import { progressApi } from '../api/progressApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { STALE_TIMES } from '../constants/queryConfig.js';
export const useDashboard = () => useQuery({ queryKey: queryKeys.dashboard, queryFn: progressApi.dashboard, staleTime: STALE_TIMES.SHORT });
