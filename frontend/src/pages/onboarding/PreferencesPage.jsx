import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, Check, Hammer, MessageSquareText } from 'lucide-react';
import { onboardingApi } from '../../api/onboardingApi.js';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import FormInput from '../../components/form/FormInput.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import { preferencesFormSchema } from '../../validations/onboarding.schema.js';
import { cn } from '../../utils/cn.js';

const defaults = {
  dailyStudyTime: 120,
  targetDurationDays: 90,
  learningStyle: 'project-based',
  knownBasics: '',
  mainFocus: 'job-preparation'
};

const studyOptions = [30, 60, 90, 120];

const focusOptions = [
  {
    value: 'job-preparation',
    title: 'Prepare for a job',
    description: 'Build skills with job readiness in mind.',
    icon: BriefcaseBusiness
  },
  {
    value: 'project-building',
    title: 'Build stronger projects',
    description: 'Spend more time applying concepts in projects.',
    icon: Hammer
  },
  {
    value: 'interview-revision',
    title: 'Revise for interviews',
    description: 'Keep interview readiness as your main focus.',
    icon: MessageSquareText
  }
];

const styleOptions = [
  {
    value: 'project-based',
    title: 'Build as I learn',
    description: 'Learn a concept, then practise it through implementation.',
    icon: Hammer
  },
  {
    value: 'theory-first',
    title: 'Concepts first',
    description: 'Understand the concept clearly before practising it.',
    icon: BookOpen
  },
  {
    value: 'interview-focused',
    title: 'Interview focused',
    description: 'Keep interview explanations and revision in focus.',
    icon: MessageSquareText
  }
];

function ChoiceCard({ option, selected, onSelect, disabled = false }) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={() => onSelect(option.value)}
      className={cn(
        'relative min-h-[150px] rounded-panel border p-5 text-left transition',
        selected
          ? 'border-primary bg-primary-soft/55 shadow-sm'
          : 'border-border bg-surface hover:border-primary/30 hover:shadow-sm'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'grid h-10 w-10 place-items-center rounded-surface',
            selected ? 'bg-primary text-white' : 'bg-surface-secondary text-primary-strong'
          )}
          aria-hidden="true"
        >
          <Icon size={18} />
        </span>
        {selected ? (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white" aria-hidden="true">
            <Check size={14} />
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 font-bold text-foreground">{option.title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{option.description}</p>
    </button>
  );
}

export default function PreferencesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const enrollment = data?.currentEnrollment;
  const offering = enrollment?.type === 'learning_path' ? enrollment?.learningPath : enrollment?.course;

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: defaults
  });

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
    if (!enrollment) return;
    reset({
      dailyStudyTime: enrollment.dailyStudyTime ?? defaults.dailyStudyTime,
      targetDurationDays: enrollment.targetDurationDays ?? defaults.targetDurationDays,
      learningStyle: enrollment.learningStyle || defaults.learningStyle,
      knownBasics: enrollment.knownBasics?.length ? enrollment.knownBasics.join(', ') : defaults.knownBasics,
      mainFocus: enrollment.mainFocus || defaults.mainFocus
    });
  }, [enrollment?._id, reset]);

  const dailyTime = Number(watch('dailyStudyTime') || 0);
  const mainFocus = watch('mainFocus');
  const learningStyle = watch('learningStyle');

  const submit = async (values) => {
    if (!enrollment?._id) return;

    try {
      const result = await onboardingApi.savePreferences({
        enrollmentId: enrollment._id,
        dailyStudyTime: Number(values.dailyStudyTime),
        targetDurationDays: Number(values.targetDurationDays),
        learningStyle: values.learningStyle,
        knownBasics: values.knownBasics.split(',').map((item) => item.trim()).filter(Boolean),
        mainFocus: values.mainFocus
      });

      navigate(
        result?.enrollment?.onboardingState === 'roadmap_pending'
          ? '/onboarding/generating'
          : '/onboarding/assessment-intro'
      );
    } catch (err) {
      setError('root', { message: err?.message || 'Could not save your preferences.' });
    }
  };

  if (isLoading) return <Loader label="Loading your learning preferences..." />;
  if (statusError) {
    return (
      <EmptyState
        title="Your preferences could not load"
        description={statusError.message}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }
  if (!enrollment || !offering) {
    return (
      <EmptyState
        title="Your course selection is missing"
        description="Choose a course or learning path before setting preferences."
        actionLabel="Open learning catalog"
        onAction={() => navigate('/onboarding/catalog')}
      />
    );
  }

  return (
    <OnboardingShell
      current="setup"
      eyebrow="Learning preferences"
      title="Set up how you want to learn"
      description={`Choose a pace and focus for ${offering.title}.`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/onboarding/level')} className="gap-2">
            <ArrowLeft size={16} aria-hidden="true" /> Previous
          </Button>
          <Button
            type="submit"
            form="preferences-form"
            isLoading={isSubmitting}
            loadingLabel="Saving..."
            className="gap-2 px-6"
          >
            Next <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      }
    >
      <form id="preferences-form" onSubmit={handleSubmit(submit)} className="space-y-9">
        <ErrorMessage message={errors.root?.message} />
        <input type="hidden" {...register('mainFocus')} />
        <input type="hidden" {...register('learningStyle')} />

        <section className="space-y-4" aria-labelledby="study-time-title">
          <div>
            <h2 id="study-time-title" className="text-lg font-bold text-foreground">Daily study time</h2>
            <p className="mt-1 text-sm text-muted-foreground">How much time can you usually study each day?</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {studyOptions.map((minutes) => {
              const active = dailyTime === minutes;
              return (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setValue('dailyStudyTime', minutes, { shouldValidate: true })}
                  className={cn(
                    'rounded-surface border px-4 py-3 text-sm font-semibold transition',
                    active
                      ? 'border-primary bg-primary-soft text-primary-strong'
                      : 'border-border bg-surface text-foreground hover:border-primary/30'
                  )}
                >
                  {minutes} min
                </button>
              );
            })}
          </div>
          <div className="max-w-xs">
            <FormInput
              label="Custom minutes"
              type="number"
              min="15"
              max="600"
              registration={register('dailyStudyTime')}
              error={errors.dailyStudyTime?.message}
            />
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="main-focus-title">
          <div>
            <h2 id="main-focus-title" className="text-lg font-bold text-foreground">Main goal</h2>
            <p className="mt-1 text-sm text-muted-foreground">What do you want this roadmap to focus on?</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {focusOptions.map((option) => (
              <ChoiceCard
                key={option.value}
                option={option}
                selected={mainFocus === option.value}
                onSelect={(value) => setValue('mainFocus', value, { shouldValidate: true })}
                disabled={isSubmitting}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="learning-style-title">
          <div>
            <h2 id="learning-style-title" className="text-lg font-bold text-foreground">Learning style</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose the style that feels most natural to you.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {styleOptions.map((option) => (
              <ChoiceCard
                key={option.value}
                option={option}
                selected={learningStyle === option.value}
                onSelect={(value) => setValue('learningStyle', value, { shouldValidate: true })}
                disabled={isSubmitting}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-5 border-t border-border pt-7 md:grid-cols-2" aria-label="Additional preferences">
          <FormInput
            label="Target timeframe in days"
            type="number"
            min="7"
            max="365"
            registration={register('targetDurationDays')}
            error={errors.targetDurationDays?.message}
          />
          <div>
            <FormInput
              label="Skills you already know"
              registration={register('knownBasics')}
              error={errors.knownBasics?.message}
              placeholder="HTML, Git, Java basics"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Optional. Separate multiple skills with commas.</p>
          </div>
        </section>
      </form>
    </OnboardingShell>
  );
}
