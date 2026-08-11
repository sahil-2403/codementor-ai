import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useDataRefresh } from '../../context/DataRefreshContext.jsx';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { cn } from '../../utils/cn.js';

const icons = { beginner: BookOpenCheck, intermediate: Gauge, advanced: GraduationCap };

export default function LevelPage() {
  const navigate = useNavigate();
  const { refreshData } = useDataRefresh();
  const { data, isLoading, error: statusError, refetch } = useAsyncData(onboardingApi.status);
  const enrollment = data?.currentEnrollment;
  const offering = enrollment?.type === 'learning_path' ? enrollment?.learningPath : enrollment?.course;
  const availableLevels = offering?.availableLevels || [];
  const visibleLevels = useMemo(() => levels.filter((level) => availableLevels.includes(level.key)), [availableLevels]);
  const [selected, setSelected] = useState('beginner');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const selectedCopy = onboardingCopyByLevel[selected] || onboardingCopyByLevel.beginner;

  useEffect(() => {
    if (!visibleLevels.length) return;
    if (enrollment?.level && availableLevels.includes(enrollment.level)) setSelected(enrollment.level);
    else if (!availableLevels.includes(selected)) setSelected(visibleLevels[0].key);
  }, [availableLevels, enrollment?.level, selected, visibleLevels]);

  const continueNext = async () => {
    if (!enrollment?._id) return;
    try {
      setSaving(true);
      setError('');
      await onboardingApi.saveLevel({ enrollmentId: enrollment._id, level: selected });
      refreshData();
      navigate('/onboarding/preferences');
    } catch (err) {
      setError(err?.message || 'Could not save your level.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Loader label="Loading your setup..." />;
  if (statusError) return <EmptyState title="Your setup could not load" description={statusError.message} actionLabel="Try again" onAction={() => refetch()} />;
  if (!enrollment || !offering) return <EmptyState title="Choose what you want to learn first" description="Select a course or complete learning path before choosing a level." actionLabel="Open learning catalog" onAction={() => navigate('/onboarding/catalog')} />;
  if (!visibleLevels.length) return <EmptyState title="No learner levels are available" description="This learning option is not ready to start yet." actionLabel="Choose another course" onAction={() => navigate('/onboarding/catalog')} />;

  return <OnboardingShell
    current="level"
    eyebrow="Step 2 · Current level"
    title="Choose the starting point that fits you"
    description={`Choose your starting level for ${offering.title}. You can start at the level that matches your current experience rather than repeating material you already know.`}
    backTo="/onboarding/catalog"
    aside={<>
      <OnboardingInsightCard title={selectedCopy.title} badge={selectedCopy.badge} items={[
        { title: 'What happens next?', description: selectedCopy.description },
        { title: 'Course context', description: enrollment.type === 'learning_path' ? `This level starts your ${offering.title} path. Individual courses in the path can still use their own recommended level when configured.` : `Your ${offering.title} roadmap and diagnostic content will use this level.` }
      ]} />
      <Card>
        <p className="font-bold text-foreground">Selected learning option</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{offering.title}</p>
        <p className="mt-1 text-xs font-semibold capitalize text-primary-strong">{enrollment.type === 'learning_path' ? 'Complete learning path' : 'Individual course'}</p>
      </Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="grid gap-4 md:grid-cols-3">
      {visibleLevels.map((level) => {
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
      <div>
        <p className="text-sm font-semibold text-muted-foreground">Selected level</p>
        <p className="text-xl font-bold capitalize text-foreground">{selected}</p>
        <p className="mt-1 text-sm text-muted-foreground">for {offering.title}</p>
      </div>
      <Button onClick={continueNext} isLoading={saving} loadingLabel="Saving level..." className="px-6">Continue to preferences</Button>
    </Card>
  </OnboardingShell>;
}
