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
      setError(err?.message || 'Could not save your assessment choice.');
    } finally {
      setSkipping(false);
    }
  };

  if (isLoading) return <Loader label="Loading assessment options..." />;
  if (statusError) return <EmptyState title="Assessment options are unavailable" description={statusError.message} actionLabel="Try again" onAction={() => refetch()} />;

  return <OnboardingShell
    current="setup"
    eyebrow="Step 3 · Diagnostic choice"
    title={`${copy.title}: choose your setup path.`}
    description="Start with a published level-based template, or take a diagnostic to detect weak topics before roadmap generation."
    backTo="/onboarding/level"
    aside={<>
      <OnboardingInsightCard title="Recommendation" badge={copy.badge} items={[
        { title: 'Take diagnostic', description: 'Useful when you are unsure about gaps or want a targeted roadmap.' },
        { title: 'Skip for now', description: 'Useful when you want to start quickly. A later diagnostic can create a newer roadmap version.' }
      ]} />
      <Card className="bg-primary-soft"><ShieldCheck className="text-primary" /><p className="mt-3 font-bold text-foreground">No lock-in</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Skipping creates a template roadmap. A later assessment preserves the old version while creating a personalized one.</p></Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="border-primary/20 bg-primary-soft">
        <span className="grid h-14 w-14 place-items-center rounded-surface bg-primary text-white" aria-hidden="true"><ClipboardCheck /></span>
        <h3 className="mt-5 text-2xl font-bold text-foreground">Take diagnostic</h3>
        <p className="mt-3 leading-7 text-muted-foreground">Answer curated MERN questions, then review category scores, weak topics, and the roadmap recommendation before generation.</p>
        <Button className="mt-6 w-full" onClick={() => navigate('/onboarding/assessment')}>Start diagnostic</Button>
      </Card>
      <Card>
        <span className="grid h-14 w-14 place-items-center rounded-surface bg-surface-secondary text-foreground" aria-hidden="true"><FastForward /></span>
        <h3 className="mt-5 text-2xl font-bold text-foreground">Use template roadmap</h3>
        <p className="mt-3 leading-7 text-muted-foreground">Start with the published {level} template now. The app will not invent assessment scores or weak topics.</p>
        <Button variant="secondary" className="mt-6 w-full" onClick={skip} isLoading={skipping} loadingLabel="Saving choice...">Skip diagnostic</Button>
      </Card>
    </div>
    <Card className="bg-foreground text-white"><BrainCircuit aria-hidden="true" /><p className="mt-3 text-xl font-bold text-white">Flexible setup</p><p className="mt-2 leading-7 text-slate-300">Both paths remain explainable: one uses published template content, while the other adds real diagnostic evidence.</p></Card>
  </OnboardingShell>;
}
