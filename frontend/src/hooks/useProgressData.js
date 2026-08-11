import { progressApi } from '../api/progressApi.js';
import { useAsyncAction } from './useAsyncAction.js';
export { useDashboard } from './useDashboardData.js';

export const useUpdateRevision = () => useAsyncAction(progressApi.updateRevision);
