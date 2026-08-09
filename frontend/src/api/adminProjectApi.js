import api from './axiosInstance.js';

const withParams = (params = {}) => ({ params: Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)) });

export const adminProjectApi = {
  list: (params) => api.get('/admin/project-tasks', withParams(params)).then((res) => res.data.data),
  get: (id) => api.get(`/admin/project-tasks/${id}`).then((res) => res.data.data),
  create: (payload) => api.post('/admin/project-tasks', payload).then((res) => res.data.data),
  update: ({ id, payload }) => api.patch(`/admin/project-tasks/${id}`, payload).then((res) => res.data.data),
  updateStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/project-tasks/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  delete: (id) => api.delete(`/admin/project-tasks/${id}`).then((res) => res.data.data)
};
