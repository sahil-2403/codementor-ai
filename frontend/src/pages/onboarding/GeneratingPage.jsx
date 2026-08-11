import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, RotateCw, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import { onboardingApi } from '../../api/onboardingApi.js';
import { roadmapApi } from '../../api/roadmapApi.js';
import { useAsyncAction } from '../../hooks/useAsyncAction.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';

export default function GeneratingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPersonalizeFlow = searchParams.get('personalize') === 'true';
  const onboardingQuery = useAsyncData(onboardingApi.status);
  const generateAction = useAsyncAction(roadmapApi.generateOrGet);
  const startedRef = useRef(false);
  const [localError, setLocalError] = useState('');
  const [showSlowHint, setShowSlowHint] = useState(false);

  const onboarding = onboardingQuery.data;
  const enrollment = onboarding?.currentEnrollment;
  const offering = enrollment?.type === 'learning_path' ? enrollment?.learningPath : enrollment?.course;
  const currentCourse = enrollment?.currentCourse || enrollment?.course;

  const startGeneration = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLocalError('');
    setShowSlowHint(false);

    try {
      const result = await generateAction.mutateAsync();
      if (result?.course) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setLocalError('Your roadmap request finished, but no roadmap was returned. Please try again.');
      startedRef.current = false;
    } catch (error) {
      setLocalError(error?.message || 'Could not create your roadmap. Please try again.');
      startedRef.current = false;
    }
  }, [generateAction, navigate]);

  useEffect(() => {
    if (onboardingQuery.isLoading || !onboarding) return;

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
  }, [enrollment?._id, navigate, onboarding, onboardingQuery.isLoading, startGeneration]);

  useEffect(() => {
    if (!generateAction.isPending) {
      setShowSlowHint(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setShowSlowHint(true), 8000);
    return () => window.clearTimeout(timer);
  }, [generateAction.isPending]);

  const displayedError = localError || onboardingQuery.error?.message || generateAction.error?.message;
  const status = useMemo(() => {
    if (displayedError) return { icon: XCircle, title: 'We could not finish your roadmap', className: 'bg-error-soft text-error' };
    if (!generateAction.isPending && onboarding?.state === 'completed') return { icon: CheckCircle2, title: 'Your roadmap is ready', className: 'bg-success-soft text-success' };
    return { icon: RotateCw, title: 'Creating your roadmap', className: 'bg-primary-soft text-primary' };
  }, [displayedError, generateAction.isPending, onboarding?.state]);

  if (onboardingQuery.isLoading) return <Loader label="Preparing your roadmap setup..." />;

  const Icon = status.icon;
  const retry = () => {
    startedRef.current = false;
    void startGeneration();
  };

  return <OnboardingShell
    current="roadmap"
    eyebrow="Step 4 · Create your roadmap"
    title={`Creating ${offering?.title || currentCourse?.title || 'your course'} roadmap`}
    description="We’re organising this enrollment’s lessons, quizzes, projects, and practice without affecting any other course you may be learning."
    aside={<>
      <OnboardingInsightCard title="What is being prepared?" badge="Course roadmap" items={[
        { title: 'Enrollment-specific plan', description: `This roadmap belongs only to ${offering?.title || currentCourse?.title || 'the selected course'} and its chosen level.` },
        { title: 'Authoritative curriculum', description: 'Personalization may change emphasis and pacing, but lesson and quiz references still come from the selected course template.' }
      ]} />
      <Card>
        <p className="font-bold text-foreground">Other courses stay independent</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">This request creates only the roadmap for the enrollment you selected.</p>
      </Card>
    </>}
  >
    <Card className="text-center">
      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-panel ${status.className}`}>
        <Icon className={generateAction.isPending ? 'animate-spin' : ''} aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-3xl font-bold text-foreground">{status.title}</h2>
      <p className="mt-3 text-muted-foreground">
        {generateAction.isPending
          ? 'CodeMentor is creating this roadmap now. Keep this page open until the request finishes.'
          : displayedError
            ? 'Your setup is safe. Fix the issue or try the request again.'
            : 'Your course roadmap is ready.'}
      </p>

      <div className="mt-5"><ErrorMessage message={displayedError} /></div>

      {showSlowHint && generateAction.isPending && <div className="ui-alert ui-alert--info mt-6 text-left">
        This is taking longer than usual because the roadmap is being created in this request. Keep the page open while it finishes.
      </div>}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {displayedError && <Button onClick={retry} isLoading={generateAction.isPending} loadingLabel="Trying again...">Try again</Button>}
        {!displayedError && !generateAction.isPending && onboarding?.state === 'completed' && <Button onClick={() => navigate('/dashboard', { replace: true })}>Open dashboard</Button>}
        {isPersonalizeFlow && displayedError && <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to dashboard</Button>}
      </div>
    </Card>
  </OnboardingShell>;
}
