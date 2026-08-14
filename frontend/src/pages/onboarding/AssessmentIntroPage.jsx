import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, FastForward } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import { onboardingApi } from '../../api/onboardingApi.js';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { cn } from '../../utils/cn.js';

const options = [
  {
    value: 'assessment',
    title: 'Take a skill check',
    description: 'Check your current knowledge before creating the roadmap.',
    icon: ClipboardCheck
  },
  {
    value: 'skip',
    title: 'Skip for now',
    description: 'Create your roadmap using your selected level and preferences.',
    icon: FastForward
  }
];

export default function AssessmentIntroPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [choice, setChoice] = useState('assessment');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setStatusError(null);

    onboardingApi.status()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setStatusError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const enrollment = data?.currentEnrollment;
  const course = enrollment?.currentCourse || enrollment?.course;
  const level = enrollment?.level || 'intermediate';

  const continueNext = async () => {
    if (choice === 'assessment') {
      navigate('/onboarding/assessment');
      return;
    }

    if (!enrollment?._id) return;

    try {
      setSaving(true);
      setError('');
      await onboardingApi.skipAssessment({ enrollmentId: enrollment._id });
      navigate('/onboarding/generating');
    } catch (err) {
      setError(err?.message || 'Could not save your choice.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Loader label="Loading your options..." />;
  if (statusError) {
    return (
      <EmptyState
        title="Your options could not load"
        description={statusError.message}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }
  if (!enrollment || !course) {
    return (
      <EmptyState
        title="Your course selection is missing"
        description="Choose a course or learning path before starting a diagnostic."
        actionLabel="Open learning catalog"
        onAction={() => navigate('/onboarding/catalog')}
      />
    );
  }
  if (level === 'beginner') {
    return (
      <EmptyState
        title="A diagnostic is not required"
        description="Beginner learners start from the course foundations."
        actionLabel="Create roadmap"
        onAction={() => navigate('/onboarding/generating')}
      />
    );
  }

  return (
    <OnboardingShell
      current="setup"
      eyebrow="Optional skill check"
      title="Do you want to take a skill check?"
      description={`Use a short ${course.title} skill check for a more focused starting roadmap, or continue without it.`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/onboarding/preferences')} className="gap-2">
            <ArrowLeft size={16} aria-hidden="true" /> Previous
          </Button>
          <Button
            type="button"
            onClick={continueNext}
            isLoading={saving}
            loadingLabel="Saving..."
            className="gap-2 px-6"
          >
            Next <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      }
    >
      <ErrorMessage message={error} />

      <div className="grid gap-4 md:grid-cols-2">
        {options.map((option) => {
          const Icon = option.icon;
          const active = choice === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={saving}
              aria-pressed={active}
              onClick={() => setChoice(option.value)}
              className={cn(
                'relative min-h-[200px] rounded-panel border p-6 text-left transition',
                active
                  ? 'border-primary bg-primary-soft/55 shadow-sm'
                  : 'border-border bg-surface hover:border-primary/30 hover:shadow-sm'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'grid h-11 w-11 place-items-center rounded-surface',
                    active ? 'bg-primary text-white' : 'bg-surface-secondary text-primary-strong'
                  )}
                  aria-hidden="true"
                >
                  <Icon size={19} />
                </span>
                {active ? (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white" aria-hidden="true">
                    <Check size={14} />
                  </span>
                ) : null}
              </div>
              <h2 className="mt-5 text-xl font-bold text-foreground">{option.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{option.description}</p>
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
