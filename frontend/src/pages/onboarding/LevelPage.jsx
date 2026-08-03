import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpenCheck, Gauge, GraduationCap } from 'lucide-react';
import { onboardingApi } from '../../api/onboardingApi.js';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import { levels } from '../../constants/levels.js';
import { onboardingCopyByLevel } from '../../constants/onboardingSteps.js';
import { queryKeys } from '../../constants/queryKeys.js';

const icons = { beginner: BookOpenCheck, intermediate: Gauge, advanced: GraduationCap };

export default function LevelPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: onboardingApi.status });
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

  return <OnboardingShell
    current="level"
    eyebrow="Step 2 · Current level"
    title="Pick the workflow that matches your current skill."
    description="Assessment is never forced. Beginners start without a test. Intermediate and advanced learners can start from a template or take a diagnostic for better personalization."
    backTo="/onboarding/goal"
    aside={<>
      <OnboardingInsightCard title={selectedCopy.title} badge={selectedCopy.badge} items={[
        { title: 'What happens next?', description: selectedCopy.description },
        { title: 'Can I change later?', description: 'Yes. You can personalize your roadmap later from the dashboard and keep old roadmap versions.' }
      ]} />
      <Card><p className="font-black text-slate-950">How this works</p><p className="mt-2 text-sm leading-6 text-slate-600">Beginners start with preferences. Intermediate and advanced learners can take a diagnostic or begin with a template roadmap and personalize later.</p></Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="grid gap-4 md:grid-cols-3">
      {levels.map((level) => {
        const Icon = icons[level.key] || BookOpenCheck;
        const active = selected === level.key;
        return <button key={level.key} disabled={saving} onClick={() => setSelected(level.key)} className={`rounded-[2rem] border p-6 text-left transition ${active ? 'border-indigo-500 bg-white shadow-soft' : 'border-slate-200 bg-white/65 hover:-translate-y-0.5 hover:bg-white hover:shadow-soft'}`}>
          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}><Icon size={20} /></div>
          <h3 className="mt-5 text-2xl font-black capitalize text-slate-950">{level.title}</h3>
          <p className="mt-2 leading-7 text-slate-600">{level.description}</p>
          <p className="mt-5 text-sm font-black text-indigo-700">{onboardingCopyByLevel[level.key]?.badge}</p>
        </button>;
      })}
    </div>
    <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div><p className="text-sm font-bold text-slate-500">Selected level</p><p className="text-xl font-black capitalize text-slate-950">{selected}</p></div>
      <Button onClick={continueNext} disabled={saving} className="px-6 py-3">{saving ? 'Saving...' : 'Continue'} <ArrowRight className="ml-2" size={18} /></Button>
    </Card>
  </OnboardingShell>;
}
