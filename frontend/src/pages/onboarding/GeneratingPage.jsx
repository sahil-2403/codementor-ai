import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, RotateCw, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import { onboardingApi } from '../../api/onboardingApi.js';
import { roadmapApi } from '../../api/roadmapApi.js';

export default function GeneratingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPersonalizeFlow = searchParams.get('personalize') === 'true';
  const [onboarding, setOnboarding] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [onboardingError, setOnboardingError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const startedRef = useRef(false);
  const [localError, setLocalError] = useState('');
  const [showSlowHint, setShowSlowHint] = useState(false);

  const enrollment = onboarding?.currentEnrollment;
  const offering = enrollment?.type === 'learning_path' ? enrollment?.learningPath : enrollment?.course;
  const currentCourse = enrollment?.currentCourse || enrollment?.course;

  useEffect(() => {
    let active = true;
    setOnboardingLoading(true);
    setOnboardingError(null);

    onboardingApi.status()
      .then((result) => {
        if (active) setOnboarding(result);
      })
      .catch((requestError) => {
        if (active) setOnboardingError(requestError);
      })
      .finally(() => {
        if (active) setOnboardingLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const startGeneration = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLocalError('');
    setShowSlowHint(false);
    setGenerating(true);

    try {
      const result = await roadmapApi.generateOrGet();
      if (result?.course) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setLocalError('Your roadmap request finished, but no roadmap was returned. Please try again.');
      startedRef.current = false;
    } catch (error) {
      setLocalError(error?.message || 'Could not create your roadmap. Please try again.');
      startedRef.current = false;
    } finally {
      setGenerating(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (onboardingLoading || !onboarding) return;

    if (onboarding.state === 'completed') {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!enrollment?._id) {
      setLocalError('Choose a course or learning path before creating a roadmap.');
      return;
    }

    if (onboarding.state === 'roadmap_failed') {
      setLocalError(onboarding.error?.message || 'Roadmap generation could not be completed. Please try again.');
      return;
    }

    if (onboarding.state !== 'roadmap_pending') {
      setLocalError('Finish your current setup step before creating a roadmap.');
      return;
    }

    void startGeneration();
  }, [enrollment?._id, navigate, onboarding, onboardingLoading, startGeneration]);

  useEffect(() => {
    if (!generating) {
      setShowSlowHint(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setShowSlowHint(true), 8000);
    return () => window.clearTimeout(timer);
  }, [generating]);

  const displayedError = localError || onboardingError?.message;
  const status = useMemo(() => {
    if (displayedError) {
      return {
        icon: XCircle,
        title: 'We could not create your roadmap',
        className: 'bg-error-soft text-error'
      };
    }
    if (!generating && onboarding?.state === 'completed') {
      return {
        icon: CheckCircle2,
        title: 'Your roadmap is ready',
        className: 'bg-success-soft text-success'
      };
    }
    return {
      icon: RotateCw,
      title: 'Creating your roadmap',
      className: 'bg-primary-soft text-primary'
    };
  }, [displayedError, generating, onboarding?.state]);

  if (onboardingLoading) return <Loader label="Preparing your roadmap setup..." />;

  const Icon = status.icon;
  const retry = () => {
    startedRef.current = false;
    void startGeneration();
  };

  return (
    <OnboardingShell
      current="roadmap"
      eyebrow="Roadmap"
      title="Creating your roadmap"
      description={`We’re preparing ${offering?.title || currentCourse?.title || 'your selected course'} using your saved setup.`}
    >
      <div className="grid min-h-[320px] place-items-center text-center">
        <div className="max-w-lg">
          <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${status.className}`} aria-hidden="true">
            <Icon size={22} className={generating ? 'animate-spin' : ''} />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-foreground">{status.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {generating
              ? 'Keep this page open while the roadmap is prepared.'
              : displayedError
                ? 'Your onboarding choices are saved. You can try again.'
                : 'Your roadmap is ready to open.'}
          </p>

          <div className="mt-5"><ErrorMessage message={displayedError} /></div>

          {showSlowHint && generating ? (
            <p className="mt-4 text-sm text-muted-foreground">This is taking a little longer than usual.</p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {displayedError ? (
              <Button onClick={retry} isLoading={generating} loadingLabel="Trying again...">Try again</Button>
            ) : null}
            {!displayedError && !generating && onboarding?.state === 'completed' ? (
              <Button onClick={() => navigate('/dashboard', { replace: true })}>Open dashboard</Button>
            ) : null}
            {isPersonalizeFlow && displayedError ? (
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
            ) : null}
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
