import api from './axiosInstance.js';
export const quizApi = {
  moduleQuiz: (moduleId) => api.get(`/quizzes/module/${moduleId}`).then((res) => res.data.data),
  submit: (payload) => api.post('/quizzes/submit', payload).then((res) => res.data.data),
  attempt: (attemptId) => api.get(`/quizzes/attempts/${attemptId}`).then((res) => res.data.data),
  explainAttempt: (attemptId) => api.post(`/quizzes/attempts/${attemptId}/explain`).then((res) => res.data.data)
};
