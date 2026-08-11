import { reportApi } from '../api/reportApi.js';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useAsyncData } from '../hooks/useAsyncData.js';

export const useReports = () => useAsyncData(reportApi.list);
export const useGenerateReport = () => useAsyncAction(reportApi.generate);
