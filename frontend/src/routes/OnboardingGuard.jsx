import { Navigate, Outlet, useLocation } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState.jsx';
import Loader from '../components/common/Loader.jsx';
import { onboardingApi } from '../api/onboardingApi.js';
import { ONBOARDING_STATE, ROADMAP_SETUP_STATES } from '../constants/domainEnums.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { useAuth } from '../hooks/useAuth.js';

export default function OnboardingGuard({ mode = 'needs-onboarding' }) {
  const location = useLocation();
  const { user } = useAuth();
  const { data, error, isLoading, refetch } = useAsyncData(
    onboardingApi.status,
    [user?._id, user?.role],
    { enabled: Boolean(user && user.role !== 'admin') }
  );

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  // On a full page refresh the async hook has one initial render before its
  // effect starts. Wait for the first onboarding response before redirecting.
  if (isLoading || data === undefined && !error) {
    return <Loader label="Checking onboarding status..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Could not check your learning setup"
        description={error.message || 'Please try again.'}
        actionLabel="Try again"
        onAction={() => refetch()}
      />
    );
  }

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
