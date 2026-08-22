import api from './axiosInstance.js';

export const authApi = {
  csrf: () => api.get('/auth/csrf-token').then((res) => res.data.data),
  register: (payload) => api.post('/auth/register', payload).then((res) => res.data.data),
  googleRegister: (credential) => api.post('/auth/google/register', { credential }).then((res) => res.data.data),
  demoAccount: () => api.post('/auth/demo-account').then((res) => res.data.data),
  verifyEmail: (payload) => api.post('/auth/verify-email', payload).then((res) => res.data.data),
  resendVerification: (payload) => api.post('/auth/resend-verification', payload).then((res) => res.data.data),
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data.data),
  googleLogin: (credential) => api.post('/auth/google/login', { credential }).then((res) => res.data.data),
  refresh: () => api.post('/auth/refresh-token').then((res) => res.data),
  logout: () => api.post('/auth/logout').then((res) => res.data),
  logoutAll: () => api.post('/auth/logout-all').then((res) => res.data),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload).then((res) => res.data.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((res) => res.data.data),
  me: () => api.get('/auth/me').then((res) => res.data.data)
};
