import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
const SESSION_EXPIRED_EVENT = 'auth:session-expired';

const readCookie = (name) => {
  if (typeof document === 'undefined') return '';
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1] || '';
};

const notifySessionExpired = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};

const csrfClient = axios.create({ baseURL, withCredentials: true });

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let refreshPromise = null;
let csrfPromise = null;

const ensureCsrfToken = async ({ force = false } = {}) => {
  const existing = readCookie('csrfToken');
  if (existing && !force) return decodeURIComponent(existing);
  csrfPromise = csrfPromise || csrfClient.get('/auth/csrf-token').then((res) => res.data?.data?.csrfToken || readCookie('csrfToken'));
  try {
    return await csrfPromise;
  } finally {
    csrfPromise = null;
  }
};

const refreshSession = async () => {
  refreshPromise = refreshPromise || api.post('/auth/refresh-token');
  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  const isWrite = !['get', 'head', 'options'].includes(method);
  const isPublicAuth = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/auth/resend-verification', '/auth/refresh-token'].some((path) => config.url?.includes(path));
  if (isWrite && !isPublicAuth) {
    const token = await ensureCsrfToken();
    if (token) config.headers['X-CSRF-Token'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh-token')) {
      originalRequest._retry = true;
      try {
        await refreshSession();
        return api(originalRequest);
      } catch {
        notifySessionExpired();
      }
    }

    if (status === 403 && error.response?.data?.message === 'Invalid CSRF token' && originalRequest && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      await ensureCsrfToken({ force: true });
      return api(originalRequest);
    }

    const payload = error.response?.data || {};
    const apiError = new Error(payload.message || error.message || 'Something went wrong');
    apiError.name = 'ApiError';
    apiError.status = status || null;
    apiError.code = payload.code || null;
    apiError.errors = payload.errors || [];
    apiError.requestId = payload.requestId || null;
    return Promise.reject(apiError);
  }
);

export default api;
