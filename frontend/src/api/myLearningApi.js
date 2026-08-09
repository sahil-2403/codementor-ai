import api from './axiosInstance.js';

export const myLearningApi = {
  list: () => api.get('/my-learning').then((res) => res.data.data),
  select: (enrollmentId) => api.post(`/my-learning/${enrollmentId}/select`).then((res) => res.data.data)
};
