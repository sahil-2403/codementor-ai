import { interviewApi } from '../api/interviewApi.js';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useAsyncData } from '../hooks/useAsyncData.js';

export const useInterviewQuestions = (params = {}) => {
  const key = JSON.stringify(params);
  return useAsyncData(() => interviewApi.questions(params), [key]);
};

export const useInterviewAttempts = () => useAsyncData(interviewApi.attempts);
export const useSubmitInterviewAnswer = () => useAsyncAction(interviewApi.submit);
export const useRetryInterviewReview = () => useAsyncAction(interviewApi.retryReview);
