import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' }
});

let csrfToken = null;
let csrfTokenRequest = null;

const fetchCsrfToken = async () => {
  if (csrfToken) return csrfToken;

  if (!csrfTokenRequest) {
    csrfTokenRequest = api
      .get('/auth/csrf-token', { _skipCsrf: true })
      .then((response) => {
        const token = response.data?.data?.csrfToken;
        if (!token) throw new Error('CSRF token missing from response');
        csrfToken = token;
        return token;
      })
      .finally(() => {
        csrfTokenRequest = null;
      });
  }

  return csrfTokenRequest;
};

api.interceptors.request.use(async (config) => {
  if (config._skipCsrf || !UNSAFE_METHODS.has((config.method || 'get').toLowerCase())) {
    return config;
  }

  const token = await fetchCsrfToken();
  config.headers = config.headers || {};
  config.headers[CSRF_HEADER_NAME] = token;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error.response?.data || {};
    const isCsrfError =
      error.response?.status === 403 &&
      String(payload.message || '').toLowerCase().includes('csrf');

    if (isCsrfError) csrfToken = null;

    if (payload.message) error.message = payload.message;
    error.code = payload.code || error.code || null;
    error.errors = payload.errors || [];
    return Promise.reject(error);
  }
);

export default api;
