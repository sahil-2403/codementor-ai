import api from './axiosInstance.js';
export const mentorApi = {
  ask: (payload) => api.post('/mentor/ask', payload).then((res) => res.data.data),
  history: () => api.get('/mentor/history').then((res) => res.data.data),
  suggestions: (lessonId) => api.get('/mentor/suggestions', { params: { lessonId } }).then((res) => res.data.data)
};
