import api from './axiosInstance.js';

const withParams = (params = {}) => ({ params: Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)) });

export const adminApi = {
  topics: (params) => api.get('/admin/topics', withParams(params)).then((res) => res.data.data),
  createTopic: (payload) => api.post('/admin/topics', payload).then((res) => res.data.data),
  updateTopic: ({ id, payload }) => api.patch(`/admin/topics/${id}`, payload).then((res) => res.data.data),
  deleteTopic: (id) => api.delete(`/admin/topics/${id}`).then((res) => res.data.data),

  lessons: (params) => api.get('/admin/lessons', withParams(params)).then((res) => res.data.data),
  lesson: (id) => api.get(`/admin/lessons/${id}`).then((res) => res.data.data),
  createLesson: (payload) => api.post('/admin/lessons', payload).then((res) => res.data.data),
  updateLesson: ({ id, payload }) => api.patch(`/admin/lessons/${id}`, payload).then((res) => res.data.data),
  updateLessonStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/lessons/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  archiveLesson: (id) => api.delete(`/admin/lessons/${id}`).then((res) => res.data.data),

  questions: (params) => api.get('/admin/questions', withParams(params)).then((res) => res.data.data),
  createQuestion: (payload) => api.post('/admin/questions', payload).then((res) => res.data.data),
  updateQuestion: ({ id, payload }) => api.patch(`/admin/questions/${id}`, payload).then((res) => res.data.data),
  updateQuestionStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/questions/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  archiveQuestion: (id) => api.delete(`/admin/questions/${id}`).then((res) => res.data.data),

  interviewQuestions: (params) => api.get('/admin/interview-questions', withParams(params)).then((res) => res.data.data),
  interviewQuestion: (id) => api.get(`/admin/interview-questions/${id}`).then((res) => res.data.data),
  createInterviewQuestion: (payload) => api.post('/admin/interview-questions', payload).then((res) => res.data.data),
  updateInterviewQuestion: ({ id, payload }) => api.patch(`/admin/interview-questions/${id}`, payload).then((res) => res.data.data),
  updateInterviewQuestionStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/interview-questions/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  archiveInterviewQuestion: (id) => api.delete(`/admin/interview-questions/${id}`).then((res) => res.data.data),

  templates: (params) => api.get('/admin/templates', withParams(params)).then((res) => res.data.data),
  createTemplate: (payload) => api.post('/admin/templates', payload).then((res) => res.data.data),
  updateTemplate: ({ id, payload }) => api.patch(`/admin/templates/${id}`, payload).then((res) => res.data.data),
  updateTemplateStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/templates/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  duplicateTemplate: (id) => api.post(`/admin/templates/${id}/duplicate`).then((res) => res.data.data),
  archiveTemplate: (id) => api.delete(`/admin/templates/${id}`).then((res) => res.data.data)
};
