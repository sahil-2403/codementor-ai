import api from './axiosInstance.js';

const withParams = (params = {}) => ({ params: Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)) });

export const adminPracticeApi = {
  list: (params) => api.get('/admin/practice-tasks', withParams(params)).then((res) => res.data.data),
  get: (id) => api.get(`/admin/practice-tasks/${id}`).then((res) => res.data.data),
  create: (payload) => api.post('/admin/practice-tasks', payload).then((res) => res.data.data),
  update: ({ id, payload }) => api.patch(`/admin/practice-tasks/${id}`, payload).then((res) => res.data.data),
  updateStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/practice-tasks/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  delete: (id) => api.delete(`/admin/practice-tasks/${id}`).then((res) => res.data.data)
};
