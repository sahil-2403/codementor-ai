import { progressApi } from '../api/progressApi.js';
import { useAsyncData } from './useAsyncData.js';

export const useDashboard = () => useAsyncData(progressApi.dashboard);
