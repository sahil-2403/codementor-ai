import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi.js';
import { useAuth } from './useAuth.js';

export function useLogout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const logoutUser = async ({ logoutFromAllDevices = false } = {}) => {
    const result = logoutFromAllDevices
      ? await authApi.logoutAll()
      : await authApi.logout();

    signOut();

    navigate('/login', {
      replace: true,
      state: {
        message: logoutFromAllDevices
          ? 'You have been logged out from all devices.'
          : 'You have been logged out successfully.'
      }
    });

    return result;
  };

  return { logoutUser };
}
