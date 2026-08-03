import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Compass, Sparkles } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import { goals } from '../../constants/goals.js';
import { onboardingApi } from '../../api/onboardingApi.js';
import { queryKeys } from '../../constants/queryKeys.js';

export default function GoalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: onboardingApi.status });
  const [selected, setSelected] = useState(goals[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const currentKey = data?.currentGoal?.goalKey;
    const current = goals.find((goal) => goal.key === currentKey);
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

  if (isLoading) return <Loader label="Loading onboarding..." />;

  return <OnboardingShell
    current="goal"
    eyebrow="Step 1 · Learning goal"
    title="Choose the path you want to master."
    description="Start with a focused learning path so your roadmap, lessons, quizzes, projects, interview practice, and mentor support stay connected."
    aside={<>
      <OnboardingInsightCard title="Why one path first?" badge="Quality first" items={[
        { title: 'Deeper content', description: 'The app feels stronger when one path has real lessons, quizzes, projects, and interviews instead of many shallow paths.' },
        { title: 'Better personalization', description: 'Assessment and recommendations become more meaningful when the topic graph is controlled.' }
      ]} />
      <Card className="bg-indigo-50"><Compass className="text-indigo-700" /><p className="mt-3 font-black text-indigo-950">Coming later</p><p className="mt-2 text-sm leading-6 text-indigo-900">React, backend, JavaScript interview prep, and DSA paths can be added through the same roadmap template system.</p></Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="grid gap-4 md:grid-cols-2">
      {goals.map((goal) => {
        const active = selected.key === goal.key;
        return <button key={goal.key} disabled={!goal.available || saving} onClick={() => setSelected(goal)} className={`group rounded-[2rem] border p-6 text-left transition ${active ? 'border-indigo-500 bg-white shadow-soft' : 'border-slate-200 bg-white/65'} ${!goal.available ? 'opacity-55' : 'hover:-translate-y-0.5 hover:bg-white hover:shadow-soft'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><Sparkles size={18} /></div>
            {active ? <CheckCircle2 className="text-indigo-600" /> : !goal.available && <Badge>Coming soon</Badge>}
          </div>
          <h3 className="mt-5 text-2xl font-black text-slate-950">{goal.title}</h3>
          <p className="mt-2 leading-7 text-slate-600">{goal.description}</p>
          {goal.available && <p className="mt-5 text-sm font-black text-indigo-700">Available now</p>}
        </button>;
      })}
    </div>
    <Card className="flex flex-col gap-4 border border-indigo-100 bg-white md:flex-row md:items-center md:justify-between">
      <div><p className="text-sm font-bold text-slate-500">Selected goal</p><p className="text-xl font-black text-slate-950">{selected.title}</p></div>
      <Button onClick={continueNext} disabled={saving} className="px-6 py-3">{saving ? 'Saving...' : 'Continue to level'} <ArrowRight className="ml-2" size={18} /></Button>
    </Card>
  </OnboardingShell>;
}
