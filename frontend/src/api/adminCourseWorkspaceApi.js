import api from './axiosInstance.js';

export const adminCourseWorkspaceApi = {
  get: (courseId) => api.get(`/admin/courses/${courseId}/workspace`).then((res) => res.data.data)
};
