import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    try {
      await authApi.csrf();
      const data = await authApi.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, []);

  const login = async (payload) => {
    const data = await authApi.login(payload);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    setUser(null);
    return data;
  };

  const verifyEmail = async (payload) => authApi.verifyEmail(payload);
  const resendVerification = async (payload) => authApi.resendVerification(payload);

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const value = useMemo(() => ({ user, isLoading, isAuthenticated: Boolean(user), login, register, verifyEmail, resendVerification, logout, reloadUser: loadUser }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used inside AuthProvider');
  return context;
};
