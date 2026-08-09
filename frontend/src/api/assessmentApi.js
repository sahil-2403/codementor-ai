import api from './axiosInstance.js';

export const assessmentApi = {
  start: ({ level, enrollmentId }) => api.get('/assessments/start', { params: { level, enrollmentId } }).then((res) => res.data.data),
  submit: (payload) => api.post('/assessments/submit', payload).then((res) => res.data.data),
  report: (assessmentId) => api.get(`/assessments/${assessmentId}/report`).then((res) => res.data.data)
};
