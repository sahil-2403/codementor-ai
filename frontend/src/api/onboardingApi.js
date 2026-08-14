import api from './axiosInstance.js';

export const onboardingApi = {
  catalog: () => api.get('/catalog').then((res) => res.data.data),
  status: () => api.get('/onboarding/status').then((res) => res.data.data),
  enrollments: () => api.get('/onboarding/enrollments').then((res) => res.data.data),
  switchEnrollment: (enrollmentId) => api.post(`/onboarding/enrollments/${enrollmentId}/current`).then((res) => res.data.data),
  selectOffering: (payload) => api.post('/onboarding/selection', payload).then((res) => res.data.data),
  saveLevel: (payload) => api.put('/onboarding/level', payload).then((res) => res.data.data),
  skipAssessment: (payload = {}) => api.post('/onboarding/assessment/skip', payload).then((res) => res.data.data)
};
