import { useState } from 'react';
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
import { useDataRefresh } from '../../context/DataRefreshContext.jsx';
import { useAsyncData } from '../../hooks/useAsyncData.js';

export default function AssessmentIntroPage() {
  const navigate = useNavigate();
  const { refreshData } = useDataRefresh();
  const { data, isLoading, error: statusError, refetch } = useAsyncData(onboardingApi.status);
  const enrollment = data?.currentEnrollment;
  const course = enrollment?.currentCourse || enrollment?.course;
  const level = enrollment?.level || 'intermediate';
  const [error, setError] = useState('');
  const [skipping, setSkipping] = useState(false);
  const copy = onboardingCopyByLevel[level] || onboardingCopyByLevel.intermediate;

  const skip = async () => {
    if (!enrollment?._id) return;
    try {
      setSkipping(true);
      setError('');
      await onboardingApi.skipAssessment({ enrollmentId: enrollment._id });
      refreshData();
      navigate('/onboarding/generating');
    } catch (err) {
      setError(err?.message || 'Could not save your choice.');
    } finally {
      setSkipping(false);
    }
  };

  if (isLoading) return <Loader label="Loading your options..." />;
  if (statusError) return <EmptyState title="Your options could not load" description={statusError.message} actionLabel="Try again" onAction={() => refetch()} />;
  if (!enrollment || !course) return <EmptyState title="Your course selection is missing" description="Choose a course or learning path before starting a diagnostic." actionLabel="Open learning catalog" onAction={() => navigate('/onboarding/catalog')} />;
  if (level === 'beginner') return <EmptyState title="A diagnostic is not required" description="Beginner learners start from the course foundations." actionLabel="Create roadmap" onAction={() => navigate('/onboarding/generating')} />;

  return <OnboardingShell
    current="setup"
    eyebrow="Step 3 · Optional skill check"
    title={`${copy.title}: choose how to begin`}
    description={`Start ${course.title} now with the recommended ${level} roadmap, or take a short course-specific skill check to focus on gaps.`}
    backTo="/onboarding/preferences"
    aside={<>
      <OnboardingInsightCard title="Choose what suits you" badge={copy.badge} items={[
        { title: 'Take the skill check', description: `Useful when you are unsure about your ${course.title} gaps or want a more focused starting roadmap.` },
        { title: 'Start now', description: 'Useful when you want to begin immediately. Your saved level and preferences still shape the roadmap.' }
      ]} />
      <Card className="bg-primary-soft"><ShieldCheck className="text-primary" /><p className="mt-3 font-bold text-foreground">Course-specific diagnostic</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Questions come only from the selected course and level, so another language or technology never leaks into this assessment.</p></Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="border-primary/20 bg-primary-soft">
        <span className="grid h-14 w-14 place-items-center rounded-surface bg-primary text-white" aria-hidden="true"><ClipboardCheck /></span>
        <h3 className="mt-5 text-2xl font-bold text-foreground">Take a skill check</h3>
        <p className="mt-3 leading-7 text-muted-foreground">Answer {course.title} questions at the {level} level, review topic scores, and identify areas to prioritise before roadmap generation.</p>
        <Button className="mt-6 w-full" onClick={() => navigate('/onboarding/assessment')}>Start skill check</Button>
      </Card>
      <Card>
        <span className="grid h-14 w-14 place-items-center rounded-surface bg-surface-secondary text-foreground" aria-hidden="true"><FastForward /></span>
        <h3 className="mt-5 text-2xl font-bold text-foreground">Start with the recommended roadmap</h3>
        <p className="mt-3 leading-7 text-muted-foreground">Use your selected {level} level and learning preferences to create the roadmap without taking a diagnostic first.</p>
        <Button variant="secondary" className="mt-6 w-full" onClick={skip} isLoading={skipping} loadingLabel="Saving choice...">Start now</Button>
      </Card>
    </div>
    <Card className="bg-foreground text-white"><BrainCircuit aria-hidden="true" /><p className="mt-3 text-xl font-bold text-white">Both choices keep the course curriculum intact</p><p className="mt-2 leading-7 text-slate-300">The skill check personalizes emphasis and pacing; it does not invent a different course or mix content from another technology.</p></Card>
  </OnboardingShell>;
}
