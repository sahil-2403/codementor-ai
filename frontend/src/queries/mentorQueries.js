import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mentorApi } from '../api/mentorApi.js';
import { queryKeys } from '../constants/queryKeys.js';

export const useMentorHistory = () => useQuery({ queryKey: queryKeys.mentorHistory, queryFn: mentorApi.history });
export const useMentorSuggestions = (lessonId) => useQuery({ queryKey: queryKeys.mentorSuggestions(lessonId), queryFn: () => mentorApi.suggestions(lessonId), staleTime: 1000 * 60 * 10 });
export const useAskMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorApi.ask,
    onSuccess: (result) => {
      if (result?.chat) queryClient.setQueryData(queryKeys.mentorHistory, { chats: [result.chat] });
      if (result?.aiAvailable === false) {
        queryClient.setQueriesData({ queryKey: ['mentor-suggestions'] }, (current) => current ? { ...current, aiAvailable: false, savedQuestions: result.savedQuestions || current.savedQuestions } : current);
      }
    }
  });
};
