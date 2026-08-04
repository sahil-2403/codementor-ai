import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Compass, Sparkles } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import { goals } from '../../constants/goals.js';
import { onboardingApi } from '../../api/onboardingApi.js';
import { queryKeys } from '../../constants/queryKeys.js';
import { cn } from '../../utils/cn.js';

export default function GoalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error: statusError, refetch } = useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: onboardingApi.status, retry: false });
  const [selected, setSelected] = useState(goals[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = goals.find((goal) => goal.key === data?.currentGoal?.goalKey);
    if (current) setSelected(current);
  }, [data?.currentGoal?.goalKey]);

  const continueNext = async () => {
    try {
      setSaving(true);
      setError('');
      await onboardingApi.saveGoal({ goalKey: selected.key, goalTitle: selected.title });
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus });
      navigate('/onboarding/level');
    } catch (err) {
      setError(err?.message || 'Could not save your learning goal.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Loader label="Loading your setup..." />;
  if (statusError) return <EmptyState title="Your setup could not load" description={statusError.message} actionLabel="Try again" onAction={() => refetch()} />;

  return <OnboardingShell
    current="goal"
    eyebrow="Step 1 · Learning goal"
    title="Choose the path you want to master"
    description="Start with one focused path so your lessons, quizzes, projects, interviews, and mentor help stay connected."
    aside={<>
      <OnboardingInsightCard title="Why choose one path?" badge="Stay focused" items={[
        { title: 'Learn in depth', description: 'A focused path gives you enough lessons and practice to build real confidence.' },
        { title: 'Get clearer guidance', description: 'Keeping one goal makes it easier to recommend the right lessons and practice.' }
      ]} />
      <Card className="bg-primary-soft"><Compass className="text-primary" /><p className="mt-3 font-bold text-foreground">More paths are coming</p><p className="mt-2 text-sm leading-6 text-muted-foreground">You can explore more learning paths when they become available.</p></Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="grid gap-4 md:grid-cols-2">
      {goals.map((goal) => {
        const active = selected.key === goal.key;
        return <button
          type="button"
          key={goal.key}
          disabled={!goal.available || saving}
          aria-pressed={active}
          onClick={() => setSelected(goal)}
          className={cn(
            'rounded-panel border p-6 text-left transition duration-200',
            active ? 'border-primary/50 bg-primary-soft shadow-soft' : 'border-border bg-surface',
            !goal.available ? 'cursor-not-allowed opacity-55' : 'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft'
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <span className={cn('grid h-12 w-12 place-items-center rounded-surface', active ? 'bg-primary text-white' : 'bg-surface-secondary text-foreground')} aria-hidden="true"><Sparkles size={18} /></span>
            {active ? <CheckCircle2 className="text-primary" aria-label="Selected" /> : !goal.available && <Badge variant="neutral">Coming soon</Badge>}
          </div>
          <h3 className="mt-5 text-2xl font-bold text-foreground">{goal.title}</h3>
          <p className="mt-2 leading-7 text-muted-foreground">{goal.description}</p>
          {goal.available && <p className="mt-5 text-sm font-semibold text-primary-strong">Available now</p>}
        </button>;
      })}
    </div>
    <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div><p className="text-sm font-semibold text-muted-foreground">Selected goal</p><p className="text-xl font-bold text-foreground">{selected.title}</p></div>
      <Button onClick={continueNext} isLoading={saving} loadingLabel="Saving goal..." className="px-6">Continue to level</Button>
    </Card>
  </OnboardingShell>;
}
