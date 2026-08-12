import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);

const getSessionUser = async () => {
  try {
    const data = await authApi.me();
    return data.user;
  } catch (error) {
    const requestUrl = error?.config?.url || '';
    if (error?.config?._authRetry || requestUrl.includes('/auth/refresh-token')) return null;

    try {
      await authApi.refresh();
      const data = await authApi.me();
      return data.user;
    } catch {
      return null;
    }
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    const sessionUser = await getSessionUser();
    setUser(sessionUser);
    setIsLoading(false);
    return sessionUser;
  }, []);

  useEffect(() => {
    let shouldIgnore = false;

    const initialize = async () => {
      const sessionUser = await getSessionUser();
      if (shouldIgnore) return;
      setUser(sessionUser);
      setIsLoading(false);
    };

    initialize();
    return () => {
      shouldIgnore = true;
    };
  }, []);

  const login = useCallback(async (payload) => {
    const data = await authApi.login(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    setUser(null);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const signOut = useCallback(() => setUser(null), []);
  const updateUser = useCallback((userData) => {
    setUser((current) => (current ? { ...current, ...userData } : current));
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    verifyEmail: authApi.verifyEmail,
    resendVerification: authApi.resendVerification,
    logout,
    signOut,
    updateUser,
    reloadUser: restoreSession
  }), [user, isLoading, login, register, logout, signOut, updateUser, restoreSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used inside AuthProvider');
  return context;
};
