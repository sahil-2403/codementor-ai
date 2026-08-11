import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Loader from '../components/common/Loader.jsx';
import { onboardingApi } from '../api/onboardingApi.js';
import { ONBOARDING_STATE, ROADMAP_SETUP_STATES } from '../constants/domainEnums.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { useAuth } from '../hooks/useAuth.js';

export default function OnboardingGuard({ mode = 'needs-onboarding' }) {
  const location = useLocation();
  const { user } = useAuth();
  const { data, isLoading } = useAsyncData(
    onboardingApi.status,
    [user?._id, user?.role],
    { enabled: Boolean(user && user.role !== 'admin') }
  );

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (isLoading) return <Loader label="Checking onboarding status..." />;

  const hasActiveCourse = Boolean(data?.hasActiveCourse);
  const hasPendingEnrollment = Boolean(data?.hasPendingEnrollment);
  const isCatalog = location.pathname === '/onboarding/catalog';
  const isPersonalizeFlow = new URLSearchParams(location.search).get('personalize') === 'true';

  if (mode === 'needs-onboarding') {
    if (data?.state === ONBOARDING_STATE.CATALOG_PENDING && !isCatalog) {
      return <Navigate to="/onboarding/catalog" replace />;
    }

    if (hasActiveCourse && !hasPendingEnrollment && !isCatalog && !isPersonalizeFlow) {
      return <Navigate to="/dashboard" replace />;
    }

    if (ROADMAP_SETUP_STATES.includes(data?.state) && location.pathname !== '/onboarding/generating') {
      return <Navigate to={data?.nextPath || '/onboarding/generating'} replace />;
    }
  }

  if (mode === 'needs-course' && !hasActiveCourse) {
    return <Navigate to={data?.nextPath || '/onboarding/catalog'} replace />;
  }

  return <Outlet />;
}
