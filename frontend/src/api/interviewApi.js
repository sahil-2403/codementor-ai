import api from './axiosInstance.js';

export const interviewApi = {
  questions: (params = {}) => api.get('/interview/questions', { params }).then((res) => res.data.data),
  question: (questionId) => api.get(`/interview/questions/${questionId}`).then((res) => res.data.data),
  attempts: () => api.get('/interview/attempts').then((res) => res.data.data),
  submit: (payload) => api.post('/interview/attempts', payload).then((res) => res.data.data)
};
