import api from './axiosInstance.js';

export const projectApi = {
  tasks: (params = {}) => api.get('/projects/tasks', { params }).then((res) => res.data.data),
  task: (taskId) => api.get(`/projects/tasks/${taskId}`).then((res) => res.data.data),
  submit: (payload) => api.post('/projects/submissions', payload).then((res) => res.data.data),
  review: (submissionId) => api.post(`/projects/submissions/${submissionId}/review`).then((res) => res.data.data)
};
