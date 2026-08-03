import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Loader from '../components/common/Loader.jsx';
import { onboardingApi } from '../api/onboardingApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { useAuth } from '../hooks/useAuth.js';

export default function OnboardingGuard({ mode = 'needs-onboarding' }) {
  const location = useLocation();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.onboardingStatus,
    queryFn: onboardingApi.status,
    enabled: Boolean(user && user.role !== 'admin')
  });

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (isLoading) return <Loader label="Checking onboarding status..." />;

  const hasActiveCourse = Boolean(data?.hasActiveCourse);
  const isPersonalizeFlow = new URLSearchParams(location.search).get('personalize') === 'true';

  if (mode === 'needs-onboarding' && hasActiveCourse && !isPersonalizeFlow) {
    return <Navigate to="/dashboard" replace />;
  }

  if (mode === 'needs-onboarding' && !hasActiveCourse) {
    if (data?.state === 'goal_pending' && location.pathname !== '/onboarding/goal') {
      return <Navigate to="/onboarding/goal" replace />;
    }
    if (['roadmap_pending', 'roadmap_generating', 'roadmap_failed'].includes(data?.state) && location.pathname !== '/onboarding/generating') {
      return <Navigate to={data?.nextPath || '/onboarding/generating'} replace />;
    }
  }

  if (mode === 'needs-course' && !hasActiveCourse) {
    return <Navigate to={data?.nextPath || '/onboarding/goal'} replace />;
  }

  return <Outlet />;
}
