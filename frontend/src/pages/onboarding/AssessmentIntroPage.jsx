import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ClipboardCheck, FastForward, ShieldCheck } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import { onboardingApi } from '../../api/onboardingApi.js';
import { onboardingCopyByLevel } from '../../constants/onboardingSteps.js';
import Loader from '../../components/common/Loader.jsx';
import { queryKeys } from '../../constants/queryKeys.js';

export default function AssessmentIntroPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: onboardingApi.status });
  const level = data?.currentGoal?.level || 'intermediate';
  const [error, setError] = useState('');
  const [skipping, setSkipping] = useState(false);
  const copy = onboardingCopyByLevel[level] || onboardingCopyByLevel.intermediate;

  const skip = async () => {
    try {
      setSkipping(true);
      setError('');
      await onboardingApi.skipAssessment();
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus });
      navigate('/onboarding/generating');
    } catch (err) { setError(err.message); }
    finally { setSkipping(false); }
  };

  if (isLoading) return <Loader label="Loading assessment options..." />;

  return <OnboardingShell
    current="setup"
    eyebrow="Step 3 · Diagnostic choice"
    title={`${copy.title}: choose how accurate your roadmap should be.`}
    description="You can start fast with a level-based template, or take a diagnostic so the app can detect weak topics before creating your roadmap."
    backTo="/onboarding/level"
    aside={<>
      <OnboardingInsightCard title="Recommendation" badge={copy.badge} items={[
        { title: 'Take diagnostic', description: 'Best if you are unsure about your gaps or want a targeted roadmap.' },
        { title: 'Skip for now', description: 'Best if you want to explore the app quickly. You can personalize later from the dashboard.' }
      ]} />
      <Card className="bg-sky-50"><ShieldCheck className="text-sky-700" /><p className="mt-3 font-black text-sky-950">No lock-in</p><p className="mt-2 text-sm leading-6 text-sky-900">Skipping creates a template roadmap version. Taking a test later creates a new active version.</p></Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="border border-indigo-100 bg-indigo-50">
        <div className="grid h-14 w-14 place-items-center rounded-3xl bg-indigo-600 text-white"><ClipboardCheck /></div>
        <h3 className="mt-5 text-2xl font-black text-indigo-950">Take diagnostic</h3>
        <p className="mt-3 leading-7 text-indigo-900">Answer curated MERN questions. You will get a diagnostic report with category scores, weak topics, and roadmap recommendation.</p>
        <Button className="mt-6 w-full py-3" onClick={() => navigate('/onboarding/assessment')}>Start diagnostic</Button>
      </Card>
      <Card>
        <div className="grid h-14 w-14 place-items-center rounded-3xl bg-slate-100 text-slate-800"><FastForward /></div>
        <h3 className="mt-5 text-2xl font-black text-slate-950">Skip and start</h3>
        <p className="mt-3 leading-7 text-slate-600">Use the standard {level} roadmap now. The dashboard will remind you that a diagnostic can improve personalization later.</p>
        <Button variant="secondary" className="mt-6 w-full py-3" onClick={skip} disabled={skipping}>{skipping ? 'Saving choice...' : 'Use template roadmap'}</Button>
      </Card>
    </div>
    <Card className="bg-slate-950 text-white"><BrainCircuit /><p className="mt-3 text-xl font-black">Flexible setup</p><p className="mt-2 leading-7 text-slate-300">Start quickly with a template roadmap, or take a diagnostic when you want deeper personalization.</p></Card>
  </OnboardingShell>;
}
