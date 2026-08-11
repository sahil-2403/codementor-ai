import { lessonApi } from '../api/lessonApi.js';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useAsyncData } from '../hooks/useAsyncData.js';

export const useLesson = (lessonId) => useAsyncData(
  () => lessonApi.get(lessonId),
  [lessonId],
  { enabled: Boolean(lessonId) }
);

export const useCompleteLesson = () => useAsyncAction(lessonApi.complete);
