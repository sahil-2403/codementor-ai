import api from './axiosInstance.js';

const withParams = (params = {}) => ({ params: Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)) });

export const adminApi = {
  contentOverview: () => api.get('/admin/content-overview').then((res) => res.data.data),

  technologies: (params) => api.get('/admin/technologies', withParams(params)).then((res) => res.data.data),
  technology: (id) => api.get(`/admin/technologies/${id}`).then((res) => res.data.data),
  createTechnology: (payload) => api.post('/admin/technologies', payload).then((res) => res.data.data),
  updateTechnology: ({ id, payload }) => api.patch(`/admin/technologies/${id}`, payload).then((res) => res.data.data),
  updateTechnologyStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/technologies/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  deleteTechnology: (id) => api.delete(`/admin/technologies/${id}`).then((res) => res.data.data),

  courses: (params) => api.get('/admin/courses', withParams(params)).then((res) => res.data.data),
  course: (id) => api.get(`/admin/courses/${id}`).then((res) => res.data.data),
  createCourse: (payload) => api.post('/admin/courses', payload).then((res) => res.data.data),
  updateCourse: ({ id, payload }) => api.patch(`/admin/courses/${id}`, payload).then((res) => res.data.data),
  updateCourseStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/courses/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`).then((res) => res.data.data),

  learningPaths: (params) => api.get('/admin/learning-paths', withParams(params)).then((res) => res.data.data),
  learningPath: (id) => api.get(`/admin/learning-paths/${id}`).then((res) => res.data.data),
  createLearningPath: (payload) => api.post('/admin/learning-paths', payload).then((res) => res.data.data),
  updateLearningPath: ({ id, payload }) => api.patch(`/admin/learning-paths/${id}`, payload).then((res) => res.data.data),
  updateLearningPathStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/learning-paths/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  deleteLearningPath: (id) => api.delete(`/admin/learning-paths/${id}`).then((res) => res.data.data),

  topics: (params) => api.get('/admin/topics', withParams(params)).then((res) => res.data.data),
  topic: (id) => api.get(`/admin/topics/${id}`).then((res) => res.data.data),
  topicImpact: (id) => api.get(`/admin/topics/${id}/impact`).then((res) => res.data.data),
  createTopic: (payload) => api.post('/admin/topics', payload).then((res) => res.data.data),
  updateTopic: ({ id, payload }) => api.patch(`/admin/topics/${id}`, payload).then((res) => res.data.data),
  updateTopicStatus: ({ id, status }) => api.patch(`/admin/topics/${id}/status`, { status }).then((res) => res.data.data),
  deleteTopic: (id) => api.delete(`/admin/topics/${id}`).then((res) => res.data.data),

  lessons: (params) => api.get('/admin/lessons', withParams(params)).then((res) => res.data.data),
  lesson: (id) => api.get(`/admin/lessons/${id}`).then((res) => res.data.data),
  lessonImpact: (id) => api.get(`/admin/lessons/${id}/impact`).then((res) => res.data.data),
  createLesson: (payload) => api.post('/admin/lessons', payload).then((res) => res.data.data),
  updateLesson: ({ id, payload }) => api.patch(`/admin/lessons/${id}`, payload).then((res) => res.data.data),
  updateLessonStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/lessons/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  deleteLesson: (id) => api.delete(`/admin/lessons/${id}`).then((res) => res.data.data),

  questions: (params) => api.get('/admin/questions', withParams(params)).then((res) => res.data.data),
  question: (id) => api.get(`/admin/questions/${id}`).then((res) => res.data.data),
  questionImpact: (id) => api.get(`/admin/questions/${id}/impact`).then((res) => res.data.data),
  createQuestion: (payload) => api.post('/admin/questions', payload).then((res) => res.data.data),
  updateQuestion: ({ id, payload }) => api.patch(`/admin/questions/${id}`, payload).then((res) => res.data.data),
  updateQuestionStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/questions/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`).then((res) => res.data.data),

  interviewQuestions: (params) => api.get('/admin/interview-questions', withParams(params)).then((res) => res.data.data),
  interviewQuestion: (id) => api.get(`/admin/interview-questions/${id}`).then((res) => res.data.data),
  interviewQuestionImpact: (id) => api.get(`/admin/interview-questions/${id}/impact`).then((res) => res.data.data),
  createInterviewQuestion: (payload) => api.post('/admin/interview-questions', payload).then((res) => res.data.data),
  updateInterviewQuestion: ({ id, payload }) => api.patch(`/admin/interview-questions/${id}`, payload).then((res) => res.data.data),
  updateInterviewQuestionStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/interview-questions/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  deleteInterviewQuestion: (id) => api.delete(`/admin/interview-questions/${id}`).then((res) => res.data.data),

  templates: (params) => api.get('/admin/templates', withParams(params)).then((res) => res.data.data),
  template: (id) => api.get(`/admin/templates/${id}`).then((res) => res.data.data),
  createTemplate: (payload) => api.post('/admin/templates', payload).then((res) => res.data.data),
  updateTemplate: ({ id, payload }) => api.patch(`/admin/templates/${id}`, payload).then((res) => res.data.data),
  updateTemplateStatus: ({ id, status, confirmPublish = false }) => api.patch(`/admin/templates/${id}/status`, { status, confirmPublish }).then((res) => res.data.data),
  deleteTemplate: (id) => api.delete(`/admin/templates/${id}`).then((res) => res.data.data)
};
