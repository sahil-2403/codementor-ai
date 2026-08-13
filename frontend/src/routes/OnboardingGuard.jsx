import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState.jsx';
import Loader from '../components/common/Loader.jsx';
import { onboardingApi } from '../api/onboardingApi.js';
import { ONBOARDING_STATE, ROADMAP_SETUP_STATES } from '../constants/domainEnums.js';
import { useAuth } from '../hooks/useAuth.js';

export default function OnboardingGuard({ mode = 'needs-onboarding' }) {
  const location = useLocation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedPath, setCheckedPath] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (!user || user.role === 'admin') {
      setIsLoading(false);
      return undefined;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    onboardingApi.status()
      .then((result) => {
        if (!active) return;
        setData(result);
        setCheckedPath(location.pathname);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError);
        setCheckedPath(location.pathname);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?._id, user?.role, location.pathname, loadAttempt]);

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  if (isLoading || checkedPath !== location.pathname) {
    return <Loader label="Checking onboarding status..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Could not check your learning setup"
        description={error.message || 'Please try again.'}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
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
