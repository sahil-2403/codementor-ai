import { reportApi } from '../api/reportApi.js';
import { useAsyncAction } from './useAsyncAction.js';
import { useAsyncData } from './useAsyncData.js';

export const useReports = () => useAsyncData(reportApi.list);
export const useGenerateReport = () => useAsyncAction(reportApi.generate);
