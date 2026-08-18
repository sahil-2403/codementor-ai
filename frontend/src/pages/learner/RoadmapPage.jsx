import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import LevelBadge from '../../components/common/LevelBadge.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import ModuleCard from '../../components/roadmap/ModuleCard.jsx';
import { onboardingApi } from '../../api/onboardingApi.js';
import { roadmapApi } from '../../api/roadmapApi.js';
import notify from '../../utils/notify.js';

const moduleLevel = (module, currentLevel) => module.level || currentLevel;

function findDefaultExpandedModule(modules = [], currentLevel) {
  if (!modules.length) return -1;

  const currentIndexes = modules
    .map((module, index) => ({ module, index }))
    .filter(({ module }) => moduleLevel(module, currentLevel) === currentLevel);
  const hasLessonStatus = (module, statuses) =>
    (module.lessons || []).some((item) => statuses.includes(item.status));

  const inProgress = currentIndexes.find(({ module }) =>
    module.status === 'in_progress' || hasLessonStatus(module, ['in_progress']));
  if (inProgress) return inProgress.index;

  const available = currentIndexes.find(({ module }) =>
    module.status === 'available' || hasLessonStatus(module, ['available']));
  if (available) return available.index;

  const incomplete = currentIndexes.find(({ module }) =>
    module.status !== 'completed' && module.status !== 'locked');
  if (incomplete) return incomplete.index;

  return currentIndexes.at(-1)?.index ?? modules.length - 1;
}

const groupModulesByLevel = (modules = [], currentLevel) => {
  const groups = [];
  modules.forEach((module, index) => {
    const level = moduleLevel(module, currentLevel);
    let group = groups.find((item) => item.level === level);
    if (!group) {
      group = { level, modules: [] };
      groups.push(group);
    }
    group.modules.push({ module, index });
  });
  return groups;
};

const titleCase = (value = '') => value
  ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
  : '';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isStartingNextLevel, setIsStartingNextLevel] = useState(false);

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
  const defaultExpandedIndex = findDefaultExpandedModule(modules, course.level);
  const currentModuleIndex = completion.isComplete
    ? -1
    : modules.findIndex((module) =>
      moduleLevel(module, course.level) === course.level && module.status !== 'completed');
  const moduleGroups = groupModulesByLevel(modules, course.level);
  const headerEyebrow = `${sourceLabel} · Version ${course.version || 1}`;

  const startNextLevel = async () => {
    if (!completion.nextLevel || !completion.enrollmentId) return;

    setIsStartingNextLevel(true);
    try {
      await onboardingApi.saveLevel({
        enrollmentId: completion.enrollmentId,
        level: completion.nextLevel
      });
      notify.success(`${titleCase(completion.nextLevel)} level selected`);
      navigate('/onboarding/assessment-intro');
    } catch (requestError) {
      notify.error(requestError.message || 'Could not start the next level');
    } finally {
      setIsStartingNextLevel(false);
    }
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow={headerEyebrow}
        eyebrowIcon={course.aiGenerated ? Sparkles : null}
        title={course.title}
        description={course.description}
        actions={<LevelBadge level={course.level} />}
      />

      {completion.isComplete && (
        <section className="flex flex-col gap-4 rounded-surface border border-success/20 bg-success-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-semibold text-success">{titleCase(course.level)} level complete</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">
              {completion.nextLevel
                ? `Ready to continue with ${titleCase(completion.nextLevel)}?`
                : 'You completed the highest available level.'}
            </h2>
            {completion.nextLevel && (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Start the next level and choose whether to take a short skill check before your new roadmap is created.
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
              Continue to {titleCase(completion.nextLevel)}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
        </section>
      )}

      <section aria-label="Roadmap modules">
        {modules.length ? (
          <div className="space-y-7">
            {moduleGroups.map((group) => {
              const isCurrentLevel = group.level === course.level;
              return (
                <section key={group.level} aria-label={`${titleCase(group.level)} level roadmap`}>
                  <div className="mb-3 flex flex-wrap items-center gap-2 pl-12 sm:pl-14">
                    <LevelBadge level={group.level} />
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isCurrentLevel
                        ? 'Current level · complete these modules to progress'
                        : 'Revision access · revisit these lessons anytime'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {group.modules.map(({ module, index }, groupIndex) => (
                      <ModuleCard
                        key={module._id || `${module.title}-${index}`}
                        module={module}
                        index={index}
                        isLast={groupIndex === group.modules.length - 1}
                        defaultExpanded={index === defaultExpandedIndex}
                        isCurrent={index === currentModuleIndex}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
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
