import api from './axiosInstance.js';
export const lessonApi = {
  get: (lessonId) => api.get(`/lessons/${lessonId}`).then((res) => res.data.data),
  complete: (lessonId) => api.post(`/lessons/${lessonId}/complete`).then((res) => res.data.data)
};
