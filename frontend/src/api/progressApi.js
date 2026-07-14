import api from './axiosInstance.js';

export const progressApi = {
  dashboard: () => api.get('/progress/dashboard').then((res) => res.data.data),
  updateRevision: ({ revisionId, status }) => api.patch(`/progress/revisions/${revisionId}`, { status }).then((res) => res.data.data)
};
