import { projectApi } from '../api/projectApi.js';
import { useAsyncAction } from './useAsyncAction.js';
import { useAsyncData } from './useAsyncData.js';

export const useProjectTasks = (params = {}) => {
  const key = JSON.stringify(params);
  return useAsyncData(() => projectApi.tasks(params), [key]);
};

export const useProjectTask = (taskId) => useAsyncData(
  () => projectApi.task(taskId),
  [taskId],
  { enabled: Boolean(taskId) }
);

export const useSubmitProjectTask = () => useAsyncAction(projectApi.submit);
export const useReviewProjectSubmission = () => useAsyncAction(projectApi.review);
