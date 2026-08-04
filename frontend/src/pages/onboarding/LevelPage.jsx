import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpenCheck, Gauge, GraduationCap } from 'lucide-react';
import { onboardingApi } from '../../api/onboardingApi.js';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import { levels } from '../../constants/levels.js';
import { onboardingCopyByLevel } from '../../constants/onboardingSteps.js';
import { queryKeys } from '../../constants/queryKeys.js';
import { cn } from '../../utils/cn.js';

const icons = { beginner: BookOpenCheck, intermediate: Gauge, advanced: GraduationCap };

export default function LevelPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error: statusError, refetch } = useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: onboardingApi.status, retry: false });
  const [selected, setSelected] = useState('beginner');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const selectedCopy = onboardingCopyByLevel[selected];

  useEffect(() => {
    if (data?.currentGoal?.level) setSelected(data.currentGoal.level);
  }, [data?.currentGoal?.level]);

  const continueNext = async () => {
    try {
      setSaving(true);
      setError('');
      const result = await onboardingApi.saveLevel({ level: selected });
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus });
      navigate(result?.goal?.onboardingState === 'preferences_pending' ? '/onboarding/preferences' : '/onboarding/assessment-intro');
    } catch (err) {
      setError(err?.message || 'Could not save your level.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Loader label="Loading your onboarding progress..." />;
  if (statusError) return <EmptyState title="Onboarding progress is unavailable" description={statusError.message} actionLabel="Try again" onAction={() => refetch()} />;

  return <OnboardingShell
    current="level"
    eyebrow="Step 2 · Current level"
    title="Choose the workflow that matches your current skill."
    description="Beginners start without a test. Intermediate and advanced learners can use a template or take a diagnostic for deeper personalization."
    backTo="/onboarding/goal"
    aside={<>
      <OnboardingInsightCard title={selectedCopy.title} badge={selectedCopy.badge} items={[
        { title: 'What happens next?', description: selectedCopy.description },
        { title: 'Can I change later?', description: 'Yes. A later diagnostic can create a new roadmap version without deleting your history.' }
      ]} />
      <Card><p className="font-bold text-foreground">How this works</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Your level selects the default roadmap depth. Assessment remains optional for intermediate and advanced learners.</p></Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="grid gap-4 md:grid-cols-3">
      {levels.map((level) => {
        const Icon = icons[level.key] || BookOpenCheck;
        const active = selected === level.key;
        return <button
          type="button"
          key={level.key}
          disabled={saving}
          aria-pressed={active}
          onClick={() => setSelected(level.key)}
          className={cn(
            'rounded-panel border p-6 text-left transition duration-200',
            active ? 'border-primary/50 bg-primary-soft shadow-soft' : 'border-border bg-surface hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft'
          )}
        >
          <span className={cn('grid h-12 w-12 place-items-center rounded-surface', active ? 'bg-primary text-white' : 'bg-surface-secondary text-foreground')} aria-hidden="true"><Icon size={20} /></span>
          <h3 className="mt-5 text-2xl font-bold capitalize text-foreground">{level.title}</h3>
          <p className="mt-2 leading-7 text-muted-foreground">{level.description}</p>
          <p className="mt-5 text-sm font-semibold text-primary-strong">{onboardingCopyByLevel[level.key]?.badge}</p>
        </button>;
      })}
    </div>
    <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div><p className="text-sm font-semibold text-muted-foreground">Selected level</p><p className="text-xl font-bold capitalize text-foreground">{selected}</p></div>
      <Button onClick={continueNext} isLoading={saving} loadingLabel="Saving level..." className="px-6">Continue</Button>
    </Card>
  </OnboardingShell>;
}
