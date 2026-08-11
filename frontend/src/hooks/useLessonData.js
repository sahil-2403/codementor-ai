import { lessonApi } from '../api/lessonApi.js';
import { useAsyncAction } from './useAsyncAction.js';
import { useAsyncData } from './useAsyncData.js';

export const useLesson = (lessonId) => useAsyncData(
  () => lessonApi.get(lessonId),
  [lessonId],
  { enabled: Boolean(lessonId) }
);

export const useCompleteLesson = () => useAsyncAction(lessonApi.complete);
