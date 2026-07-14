import api from './axiosInstance.js';
export const reportApi = {
  list: () => api.get('/reports').then((res) => res.data.data),
  generate: () => api.post('/reports/generate').then((res) => res.data.data)
};
