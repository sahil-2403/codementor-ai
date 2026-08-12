import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import ModuleCard from '../../components/roadmap/ModuleCard.jsx';
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
  const sourceLabel = course.aiGenerated
    ? 'Personalized roadmap'
    : 'Standard roadmap';
  const defaultExpandedIndex = findDefaultExpandedModule(modules);
  const headerEyebrow = `${sourceLabel} · ${course.level || 'learner'} level · Version ${course.version || 1}`;

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow={headerEyebrow}
        eyebrowIcon={Sparkles}
        title={course.title}
        description={course.description}
      />

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
