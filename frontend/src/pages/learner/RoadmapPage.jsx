import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import ModuleCard from '../../components/roadmap/ModuleCard.jsx';
import { useRoadmap } from '../../queries/roadmapQueries.js';

export default function RoadmapPage() {
  const { data, isLoading } = useRoadmap();
  if (isLoading) return <Loader label="Loading roadmap..." />;
  const course = data?.course;
  if (!course) return <EmptyState title="No roadmap found" description="Create your learning goal first." />;
  return <PageShell>
    <PageHeader eyebrow={`Roadmap · v${course.version || 1}`} title={course.title} description={course.description} />
    {course.modules?.map((module) => <ModuleCard key={module._id} module={module} />)}
  </PageShell>;
}
