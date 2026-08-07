import { BookOpenCheck, Layers3, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import ModuleCard from '../../components/roadmap/ModuleCard.jsx';
import { useRoadmap } from '../../queries/roadmapQueries.js';

function RoadmapProgressRing({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className="relative grid h-20 w-20 shrink-0 place-items-center" aria-label={`${safeValue}% roadmap completion`}>
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-secondary" />
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - safeValue}
          className="text-primary transition-all duration-700"
        />
      </svg>
      <div className="relative text-center">
        <p className="text-lg font-extrabold leading-none text-foreground">{safeValue}%</p>
        <p className="mt-1 text-[9px] font-semibold text-muted-foreground">complete</p>
      </div>
    </div>
  );
}

function findDefaultExpandedModule(modules = []) {
  if (!modules.length) return -1;

  const hasLessonStatus = (module, statuses) => (module.lessons || []).some((item) => statuses.includes(item.status));

  const inProgress = modules.findIndex((module) => module.status === 'in_progress' || hasLessonStatus(module, ['in_progress']));
  if (inProgress >= 0) return inProgress;

  const available = modules.findIndex((module) => module.status === 'available' || hasLessonStatus(module, ['available']));
  if (available >= 0) return available;

  const incomplete = modules.findIndex((module) => module.status !== 'completed' && module.status !== 'locked');
  if (incomplete >= 0) return incomplete;

  return modules.length - 1;
}

export default function RoadmapPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useRoadmap();

  if (isLoading) return <Loader label="Loading roadmap..." />;
  if (error) return <EmptyState title="Roadmap is unavailable" description={error.message} actionLabel="Try again" onAction={() => refetch()} />;

  const course = data?.course;
  if (!course) return <EmptyState title="No active roadmap found" description="Complete your setup to create a learning roadmap." actionLabel="Open dashboard" onAction={() => navigate('/dashboard')} />;

  const modules = course.modules || [];
  const allLessons = modules.flatMap((module) => module.lessons || []);
  const completedLessons = allLessons.filter((item) => item.status === 'completed').length;
  const completedModules = modules.filter((module) => module.status === 'completed').length;
  const completion = allLessons.length ? Math.round((completedLessons / allLessons.length) * 100) : 0;
  const sourceLabel = course.aiGenerated ? 'Personalized roadmap' : 'Standard roadmap';
  const sourceDescription = course.aiGenerated
    ? 'Focused using your setup and available skill-check results.'
    : 'Built from the reviewed learning plan for your selected level.';
  const defaultExpandedIndex = findDefaultExpandedModule(modules);

  return (
    <PageShell className="space-y-5 pb-6">
      <section className="overflow-hidden rounded-panel border border-primary/15 bg-gradient-to-br from-surface via-primary-soft/55 to-violet-50 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-primary-strong">
                <Sparkles size={14} aria-hidden="true" />
                {sourceLabel}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="capitalize text-muted-foreground">{course.level || 'learner'} level</span>
              <span className="text-muted-foreground">· Version {course.version || 1}</span>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{course.title}</h1>
            {course.description && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{course.description}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-white/70 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                <Layers3 size={13} aria-hidden="true" />
                {completedModules}/{modules.length} modules completed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-white/70 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                <BookOpenCheck size={13} aria-hidden="true" />
                {completedLessons}/{allLessons.length} lessons completed
              </span>
            </div>
          </div>

          <RoadmapProgressRing value={completion} />
        </div>

        <div className="flex items-start gap-2 border-t border-primary/10 bg-white/45 px-5 py-3 text-xs leading-5 text-muted-foreground sm:px-6">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-primary-strong" aria-hidden="true" />
          <p><span className="font-semibold text-foreground">How this roadmap was created:</span> {sourceDescription}</p>
        </div>
      </section>

      <section aria-labelledby="modules-title">
        <div className="mb-4">
          <p className="ui-eyebrow">Your learning path</p>
          <h2 id="modules-title" className="ui-section-title">Modules and lessons</h2>
          <p className="ui-section-description">Follow the path in order. Expand any module to review its lessons and module quiz state.</p>
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
          <EmptyState title="No modules are available" description="This roadmap does not have any lessons yet." />
        )}
      </section>
    </PageShell>
  );
}
