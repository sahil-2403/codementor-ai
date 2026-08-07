import { BarChart3, BookOpenCheck, Layers3, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import CourseProgress from '../../components/dashboard/CourseProgress.jsx';
import ModuleCard from '../../components/roadmap/ModuleCard.jsx';
import { useRoadmap } from '../../queries/roadmapQueries.js';

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

      <section className="overflow-hidden rounded-panel border border-primary/15 bg-gradient-to-br from-surface via-primary-soft/45 to-violet-50 shadow-sm">
        <div className="p-5 sm:p-6">
          <CourseProgress
            variant="embedded"
            title="Roadmap completion"
            completionLabel="Overall progress"
            ariaLabel="Roadmap completion"
            icon={BarChart3}
            value={completion}
            completed={completedLessons}
            total={allLessons.length}
          />
        </div>

        <div className="grid border-t border-primary/10 bg-white/40 sm:grid-cols-2">
          <div className="flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true">
              <Layers3 size={19} />
            </span>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">{completedModules}/{modules.length}</p>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground sm:text-sm">Modules completed</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-primary/10 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6 sm:py-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-blue-50 text-blue-600" aria-hidden="true">
              <BookOpenCheck size={19} />
            </span>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">{completedLessons}/{allLessons.length}</p>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground sm:text-sm">Lessons completed</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 border-t border-primary/10 bg-white/45 px-5 py-3.5 text-xs leading-5 text-muted-foreground sm:px-6">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true">
            <Sparkles size={14} />
          </span>
          <div>
            <p className="font-semibold text-foreground">How this roadmap was created</p>
            <p className="mt-0.5">{sourceDescription}</p>
          </div>
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
