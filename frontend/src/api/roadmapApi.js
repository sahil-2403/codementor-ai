import api from './axiosInstance.js';

export const roadmapApi = {
  current: () => api.get('/roadmaps/current').then((res) => res.data.data),
  versions: () => api.get('/roadmaps/versions').then((res) => res.data.data),
  generateOrGet: () => api.post('/roadmaps/generate-or-get').then((res) => res.data.data),
  fromAssessment: (payload) => api.post('/roadmaps/from-assessment', payload).then((res) => res.data.data),
  personalizeLater: () => api.post('/roadmaps/personalize-later').then((res) => res.data.data)
};
