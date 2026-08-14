import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, Gauge, GraduationCap } from 'lucide-react';
import { onboardingApi } from '../../api/onboardingApi.js';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import { levels } from '../../constants/levels.js';
import { cn } from '../../utils/cn.js';

const icons = {
  beginner: BookOpenCheck,
  intermediate: Gauge,
  advanced: GraduationCap
};

export default function LevelPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selected, setSelected] = useState('beginner');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const enrollment = data?.currentEnrollment;
  const offering = enrollment?.type === 'learning_path' ? enrollment?.learningPath : enrollment?.course;
  const availableLevels = offering?.availableLevels || [];
  const visibleLevels = useMemo(
    () => levels.filter((level) => availableLevels.includes(level.key)),
    [availableLevels]
  );

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

  useEffect(() => {
    if (!visibleLevels.length) return;
    if (enrollment?.level && availableLevels.includes(enrollment.level)) {
      setSelected(enrollment.level);
    } else if (!availableLevels.includes(selected)) {
      setSelected(visibleLevels[0].key);
    }
  }, [availableLevels, enrollment?.level, selected, visibleLevels]);

  const continueNext = async () => {
    if (!enrollment?._id) return;

    try {
      setSaving(true);
      setError('');
      await onboardingApi.saveLevel({ enrollmentId: enrollment._id, level: selected });
      navigate('/onboarding/preferences');
    } catch (err) {
      setError(err?.message || 'Could not save your level.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Loader label="Loading your setup..." />;
  if (statusError) {
    return (
      <EmptyState
        title="Your setup could not load"
        description={statusError.message}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }
  if (!enrollment || !offering) {
    return (
      <EmptyState
        title="Choose what you want to learn first"
        description="Select a course or complete learning path before choosing a level."
        actionLabel="Open learning catalog"
        onAction={() => navigate('/onboarding/catalog')}
      />
    );
  }
  if (!visibleLevels.length) {
    return (
      <EmptyState
        title="No learner levels are available"
        description="This learning option is not ready to start yet."
        actionLabel="Choose another course"
        onAction={() => navigate('/onboarding/catalog')}
      />
    );
  }

  return (
    <OnboardingShell
      current="level"
      eyebrow="Current level"
      title="What’s your current level?"
      description={`Choose the option that best matches your experience with ${offering.title}.`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/onboarding/catalog')} className="gap-2">
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

      <div className="grid gap-4 md:grid-cols-3">
        {visibleLevels.map((level) => {
          const Icon = icons[level.key] || BookOpenCheck;
          const active = selected === level.key;

          return (
            <button
              type="button"
              key={level.key}
              disabled={saving}
              aria-pressed={active}
              onClick={() => setSelected(level.key)}
              className={cn(
                'relative min-h-[210px] rounded-panel border p-6 text-left transition',
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

              <h2 className="mt-5 text-xl font-bold text-foreground">{level.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{level.description}</p>
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
