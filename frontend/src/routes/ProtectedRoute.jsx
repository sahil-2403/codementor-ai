import { Navigate, Outlet } from 'react-router-dom';
import Loader from '../components/common/Loader.jsx';
import { useAuth } from '../hooks/useAuth.js';
export default function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <Loader label="Checking session..." />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
