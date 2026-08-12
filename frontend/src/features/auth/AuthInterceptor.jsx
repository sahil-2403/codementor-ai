import { useEffect } from 'react';
import api from '../../api/axiosInstance.js';
import { authApi } from '../../api/authApi.js';
import { useAuth } from '../../hooks/useAuth.js';

export default function AuthInterceptor({ children }) {
  const { signOut } = useAuth();

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || '';
        const isRefreshRequest = requestUrl.includes('/auth/refresh-token');
        const isLoginRequest = requestUrl.includes('/auth/login');

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._authRetry &&
          !isRefreshRequest &&
          !isLoginRequest
        ) {
          originalRequest._authRetry = true;

          try {
            await authApi.refresh();
            return api(originalRequest);
          } catch (refreshError) {
            signOut();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [signOut]);

  return children;
}
