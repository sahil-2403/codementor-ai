import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import ModuleCard from '../../components/roadmap/ModuleCard.jsx';
import { onboardingApi } from '../../api/onboardingApi.js';
import { roadmapApi } from '../../api/roadmapApi.js';

function findDefaultExpandedModule(modules = []) {
  if (!modules.length) return -1;

  const hasLessonStatus = (module, statuses) =>
    (module.lessons || []).some((item) => statuses.includes(item.status));

  const inProgress = modules.findIndex(
    (module) =>
      module.status === 'in_progress' ||
      hasLessonStatus(module, ['in_progress'])
  );
  if (inProgress >= 0) return inProgress;

  const available = modules.findIndex(
    (module) =>
      module.status === 'available' || hasLessonStatus(module, ['available'])
  );
  if (available >= 0) return available;

  const incomplete = modules.findIndex(
    (module) => module.status !== 'completed' && module.status !== 'locked'
  );
  if (incomplete >= 0) return incomplete;

  return modules.length - 1;
}

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isStartingNextLevel, setIsStartingNextLevel] = useState(false);
  const [nextLevelError, setNextLevelError] = useState(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    roadmapApi.current()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  if (isLoading) return <Loader label="Loading roadmap..." />;
  if (error) {
    return (
      <EmptyState
        title="Roadmap is unavailable"
        description={error.message}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }

  const course = data?.course;
  if (!course) {
    return (
      <EmptyState
        title="No active roadmap found"
        description="Complete your setup to create a learning roadmap."
        actionLabel="Open dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const modules = course.modules || [];
  const completion = data?.completion || {};
  const sourceLabel = course.aiGenerated
    ? 'Personalized roadmap'
    : 'Standard roadmap';
  const defaultExpandedIndex = findDefaultExpandedModule(modules);
  const headerEyebrow = `${sourceLabel} · ${course.level || 'learner'} level · Version ${course.version || 1}`;

  const startNextLevel = async () => {
    if (!completion.nextLevel || !completion.enrollmentId) return;

    setIsStartingNextLevel(true);
    setNextLevelError(null);
    try {
      await onboardingApi.saveLevel({
        enrollmentId: completion.enrollmentId,
        level: completion.nextLevel
      });
      navigate('/onboarding/assessment-intro');
    } catch (requestError) {
      setNextLevelError(requestError);
    } finally {
      setIsStartingNextLevel(false);
    }
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow={headerEyebrow}
        eyebrowIcon={Sparkles}
        title={course.title}
        description={course.description}
      />

      {completion.isComplete && (
        <section className="flex flex-col gap-4 rounded-panel border border-success/20 bg-success-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-semibold text-success">{course.level} level complete</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">
              {completion.nextLevel
                ? `Ready to continue with ${completion.nextLevel}?`
                : 'You completed the highest available level.'}
            </h2>
            {completion.nextLevel && (
              <p className="mt-1 text-sm text-muted-foreground">
                Continue to the next level and choose whether to take a short skill check before your new roadmap is created.
              </p>
            )}
          </div>

          {completion.nextLevel && (
            <Button
              onClick={startNextLevel}
              isLoading={isStartingNextLevel}
              loadingLabel="Starting next level..."
              className="shrink-0 gap-2"
            >
              Continue to {completion.nextLevel}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
        </section>
      )}

      <ErrorMessage message={nextLevelError?.message} />

      <section aria-labelledby="modules-title">
        <div className="mb-4">
          <p className="ui-eyebrow">Your learning path</p>
          <h2 id="modules-title" className="ui-section-title">
            Modules and lessons
          </h2>
          <p className="ui-section-description">
            Follow the path in order. Expand any module to review its lessons
            and module quiz state.
          </p>
        </div>

        {modules.length ? (
          <div className="space-y-4">
            {modules.map((module, index) => (
              <ModuleCard
                key={module._id || `${module.title}-${index}`}
                module={module}
                index={index}
                isLast={index === modules.length - 1}
                defaultExpanded={index === defaultExpandedIndex}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No modules are available"
            description="This roadmap does not have any lessons yet."
          />
        )}
      </section>
    </PageShell>
  );
}
