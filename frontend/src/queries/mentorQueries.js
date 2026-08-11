import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mentorApi } from '../api/mentorApi.js';
import { queryKeys } from '../constants/queryKeys.js';

const consumeMentorAutoSendUrl = (lessonId) => {
  if (typeof window === 'undefined' || window.location.pathname !== '/mentor') return;

  const params = new URLSearchParams(window.location.search);
  if (params.get('autoSend') !== 'true') return;

  const urlLessonId = params.get('lessonId');
  if (urlLessonId && lessonId && urlLessonId !== String(lessonId)) return;

  params.delete('autoSend');
  params.delete('promptType');

  const search = params.toString();
  const cleanUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;

  // Keep React Router's existing history state/key intact while consuming the
  // one-time handoff. The current Mentor render still owns the first send,
  // but a browser refresh now sees a clean URL and cannot send it again.
  window.history.replaceState(window.history.state, '', cleanUrl);
};

export const useMentorHistory = () => useQuery({
  queryKey: queryKeys.mentorHistory,
  queryFn: mentorApi.history
});

export const useMentorSuggestions = (lessonId) => {
  const query = useQuery({
    queryKey: queryKeys.mentorSuggestions(lessonId),
    queryFn: () => mentorApi.suggestions(lessonId),
    staleTime: 1000 * 60 * 10
  });

  useEffect(() => {
    consumeMentorAutoSendUrl(lessonId);
  }, [lessonId]);

  return query;
};

export const useMentorAIStatus = () => useQuery({
  queryKey: queryKeys.mentorAIStatus,
  queryFn: mentorApi.status,
  staleTime: 1000 * 30
});

export const useAskMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorApi.ask,
    onSuccess: (result) => {
      if (result?.chat) queryClient.setQueryData(queryKeys.mentorHistory, { chats: [result.chat] });
      if (result?.aiAvailable === false) {
        queryClient.setQueriesData(
          { queryKey: ['mentor-suggestions'] },
          (current) => current ? {
            ...current,
            aiAvailable: false,
            savedQuestions: result.savedQuestions || current.savedQuestions
          } : current
        );
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.mentorAIStatus })
  });
};
