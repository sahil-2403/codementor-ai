import { mentorApi } from '../api/mentorApi.js';
import { useAsyncAction } from './useAsyncAction.js';
import { useAsyncData } from './useAsyncData.js';

export const useMentorHistory = () => useAsyncData(mentorApi.history);

export const useMentorSuggestions = (lessonId) => useAsyncData(
  () => mentorApi.suggestions(lessonId),
  [lessonId]
);

export const useMentorAIStatus = () => useAsyncData(mentorApi.status);
export const useAskMentor = () => useAsyncAction(mentorApi.ask);
