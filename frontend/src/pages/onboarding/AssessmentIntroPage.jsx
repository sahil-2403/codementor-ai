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
import EmptyState from '../../components/common/EmptyState.jsx';
import { queryKeys } from '../../constants/queryKeys.js';

export default function AssessmentIntroPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error: statusError, refetch } = useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: onboardingApi.status, retry: false });
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
    } catch (err) {
      setError(err?.message || 'Could not save your choice.');
    } finally {
      setSkipping(false);
    }
  };

  if (isLoading) return <Loader label="Loading your options..." />;
  if (statusError) return <EmptyState title="Your options could not load" description={statusError.message} actionLabel="Try again" onAction={() => refetch()} />;

  return <OnboardingShell
    current="setup"
    eyebrow="Step 3 · Choose your setup"
    title={`${copy.title}: choose how to begin`}
    description="Start now with the recommended roadmap, or take a short skill check to focus on topics that need more practice."
    backTo="/onboarding/level"
    aside={<>
      <OnboardingInsightCard title="Choose what suits you" badge={copy.badge} items={[
        { title: 'Take the skill check', description: 'Useful when you are unsure about your gaps or want a more focused roadmap.' },
        { title: 'Start now', description: 'Useful when you want to begin learning immediately. You can take the skill check later.' }
      ]} />
      <Card className="bg-primary-soft"><ShieldCheck className="text-primary" /><p className="mt-3 font-bold text-foreground">You can change later</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Taking a skill check later can update your roadmap without removing your earlier progress.</p></Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="border-primary/20 bg-primary-soft">
        <span className="grid h-14 w-14 place-items-center rounded-surface bg-primary text-white" aria-hidden="true"><ClipboardCheck /></span>
        <h3 className="mt-5 text-2xl font-bold text-foreground">Take a skill check</h3>
        <p className="mt-3 leading-7 text-muted-foreground">Answer MERN questions, review your topic scores, and see which areas to prioritise before creating your roadmap.</p>
        <Button className="mt-6 w-full" onClick={() => navigate('/onboarding/assessment')}>Start skill check</Button>
      </Card>
      <Card>
        <span className="grid h-14 w-14 place-items-center rounded-surface bg-surface-secondary text-foreground" aria-hidden="true"><FastForward /></span>
        <h3 className="mt-5 text-2xl font-bold text-foreground">Start with the recommended roadmap</h3>
        <p className="mt-3 leading-7 text-muted-foreground">Begin with a roadmap designed for the {level} level and adjust it later as your skills grow.</p>
        <Button variant="secondary" className="mt-6 w-full" onClick={skip} isLoading={skipping} loadingLabel="Saving choice...">Start now</Button>
      </Card>
    </div>
    <Card className="bg-foreground text-white"><BrainCircuit aria-hidden="true" /><p className="mt-3 text-xl font-bold text-white">Both choices keep you moving</p><p className="mt-2 leading-7 text-slate-300">You can begin immediately or use the skill check for extra guidance. Your learning history stays available either way.</p></Card>
  </OnboardingShell>;
}
