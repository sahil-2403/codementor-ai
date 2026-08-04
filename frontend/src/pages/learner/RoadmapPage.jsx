import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, Layers3, Sparkles } from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import MetricGrid from '../../components/common/MetricGrid.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import ProgressChart from '../../components/dashboard/ProgressChart.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import ModuleCard from '../../components/roadmap/ModuleCard.jsx';
import { useRoadmap } from '../../queries/roadmapQueries.js';

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
    ? 'This roadmap uses your setup and available skill-check results to focus your learning.'
    : 'This roadmap follows a reviewed learning plan for your selected level.';

  return <PageShell>
    <PageHeader
      eyebrow={`Roadmap · Version ${course.version || 1}`}
      title={course.title}
      description={course.description}
      actions={<Badge variant={course.aiGenerated ? 'info' : 'neutral'}>{sourceLabel}</Badge>}
    />

    <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
      <ProgressChart value={completion} completed={completedLessons} total={allLessons.length} title="Roadmap completion" />
      <Card>
        <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-surface bg-primary-soft text-primary" aria-hidden="true"><Sparkles size={20} /></span><div><h2 className="text-xl font-bold text-foreground">How this roadmap was created</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{sourceDescription}</p></div></div>
        <div className="mt-5 flex flex-wrap gap-2"><Badge variant="neutral">{course.level || 'learner'} level</Badge><Badge variant="neutral">Version {course.version || 1}</Badge></div>
      </Card>
    </div>

    <MetricGrid columns="sm:grid-cols-2 lg:grid-cols-3">
      <StatCard icon={Layers3} title="Modules completed" value={`${completedModules}/${modules.length}`} subtitle="Your current roadmap" />
      <StatCard icon={BookOpenCheck} title="Lessons completed" value={`${completedLessons}/${allLessons.length}`} subtitle="Across all modules" />
      <StatCard icon={Sparkles} title="Roadmap type" value={course.aiGenerated ? 'Personalized' : 'Standard'} subtitle={course.aiGenerated ? 'Focused using your learning information' : 'Designed for your selected level'} />
    </MetricGrid>

    <section className="space-y-5" aria-labelledby="modules-title">
      <div><p className="ui-eyebrow">Your learning plan</p><h2 id="modules-title" className="ui-section-title">Modules and lessons</h2><p className="ui-section-description">Complete the available lessons to unlock later modules. A quiz appears when one is available for the module.</p></div>
      {modules.length ? modules.map((module, index) => <ModuleCard key={module._id || `${module.title}-${index}`} module={module} index={index} />) : <EmptyState title="No modules are available" description="This roadmap does not have any lessons yet." />}
    </section>
  </PageShell>;
}
