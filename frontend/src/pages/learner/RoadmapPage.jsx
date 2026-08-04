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
  if (!course) return <EmptyState title="No active roadmap found" description="Complete onboarding to create a published template or personalized roadmap." actionLabel="Open dashboard" onAction={() => navigate('/dashboard')} />;

  const modules = course.modules || [];
  const allLessons = modules.flatMap((module) => module.lessons || []);
  const completedLessons = allLessons.filter((item) => item.status === 'completed').length;
  const completedModules = modules.filter((module) => module.status === 'completed').length;
  const completion = allLessons.length ? Math.round((completedLessons / allLessons.length) * 100) : 0;
  const sourceLabel = course.aiGenerated ? 'Gemini personalized' : 'Published template';

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
        <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-surface bg-primary-soft text-primary" aria-hidden="true"><Sparkles size={20} /></span><div><h2 className="text-xl font-bold text-foreground">Roadmap provenance</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{course.aiGenerated ? 'Gemini produced this version from trusted application context and validated structured output.' : 'This version uses curated, published template content. It is not labelled as AI-generated.'}</p></div></div>
        <div className="mt-5 flex flex-wrap gap-2"><Badge variant="neutral">{String(course.generatedReason || 'initial_template').replaceAll('_', ' ')}</Badge><Badge variant="neutral">{course.level || 'learner'} level</Badge><Badge variant="neutral">{course.roadmapType || 'template'} roadmap</Badge></div>
      </Card>
    </div>

    <MetricGrid columns="sm:grid-cols-2 lg:grid-cols-3">
      <StatCard icon={Layers3} title="Modules completed" value={`${completedModules}/${modules.length}`} subtitle="Current roadmap version" />
      <StatCard icon={BookOpenCheck} title="Lessons completed" value={`${completedLessons}/${allLessons.length}`} subtitle="Stored module lesson status" />
      <StatCard icon={Sparkles} title="Roadmap source" value={course.aiGenerated ? 'Gemini' : 'Template'} subtitle={String(course.generatedReason || 'initial template').replaceAll('_', ' ')} />
    </MetricGrid>

    <section className="space-y-5" aria-labelledby="modules-title">
      <div><p className="ui-eyebrow">Course structure</p><h2 id="modules-title" className="ui-section-title">Modules and lessons</h2><p className="ui-section-description">Complete available lessons to unlock later modules. A quiz appears only when the module has published quiz questions.</p></div>
      {modules.length ? modules.map((module, index) => <ModuleCard key={module._id || `${module.title}-${index}`} module={module} index={index} />) : <EmptyState title="No modules are available" description="The active roadmap does not currently contain any published modules." />}
    </section>
  </PageShell>;
}
