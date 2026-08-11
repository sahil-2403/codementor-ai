import { mentorApi } from '../api/mentorApi.js';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useAsyncData } from '../hooks/useAsyncData.js';

export const useMentorHistory = () => useAsyncData(mentorApi.history);

export const useMentorSuggestions = (lessonId) => useAsyncData(
  () => mentorApi.suggestions(lessonId),
  [lessonId]
);

export const useMentorAIStatus = () => useAsyncData(mentorApi.status);
export const useAskMentor = () => useAsyncAction(mentorApi.ask);
