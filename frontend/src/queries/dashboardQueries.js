import { progressApi } from '../api/progressApi.js';
import { useAsyncData } from '../hooks/useAsyncData.js';

export const useDashboard = () => useAsyncData(progressApi.dashboard);
