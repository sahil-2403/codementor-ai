import { progressApi } from '../api/progressApi.js';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
export { useDashboard } from './dashboardQueries.js';

export const useUpdateRevision = () => useAsyncAction(progressApi.updateRevision);
