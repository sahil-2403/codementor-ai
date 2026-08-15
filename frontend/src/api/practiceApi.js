import api from './axiosInstance.js';

export const practiceApi = {
  tasks: (params = {}) => api.get('/practice/tasks', { params }).then((res) => res.data.data),
  task: (taskId) => api.get(`/practice/tasks/${taskId}`).then((res) => res.data.data),
  submit: (payload) => api.post('/practice/submissions', payload).then((res) => res.data.data),
  review: (submissionId) => api.post(`/practice/submissions/${submissionId}/review`).then((res) => res.data.data)
};
