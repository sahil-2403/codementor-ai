import Loader from '../../components/common/Loader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import MetricGrid from '../../components/common/MetricGrid.jsx';
import SectionHeader from '../../components/common/SectionHeader.jsx';
import AdminStatCard from '../../components/admin/AdminStatCard.jsx';
import Card from '../../components/common/Card.jsx';
import { useAdminAnalytics } from '../../queries/adminQueries.js';

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminAnalytics();
  if (isLoading) return <Loader label="Loading admin dashboard..." />;
  const stats = data?.stats || {};
  return <PageShell>
    <PageHeader eyebrow="Admin CMS" title="Content and platform overview" description="Monitor content, users, AI activity, jobs, and audit signals from a consistent production-style admin surface." />
    <MetricGrid columns="md:grid-cols-5"><AdminStatCard title="Users" value={stats.users || 0} /><AdminStatCard title="Lessons" value={stats.lessons || 0} /><AdminStatCard title="Published" value={stats.publishedLessons || 0} /><AdminStatCard title="Questions" value={stats.questions || 0} /><AdminStatCard title="Templates" value={stats.templates || 0} /></MetricGrid>
    <MetricGrid columns="md:grid-cols-5"><AdminStatCard title="Courses" value={stats.courses || 0} /><AdminStatCard title="AI logs" value={stats.aiLogs || 0} /><AdminStatCard title="Jobs" value={stats.jobs || 0} /><AdminStatCard title="Failed jobs" value={stats.failedJobs || 0} /><AdminStatCard title="Interview attempts" value={stats.interviewAttempts || 0} /></MetricGrid>
    <Card><SectionHeader title="Production workflow" description="These admin modules are intentionally separated so you can learn CMS lifecycle, job monitoring, and audit-trail architecture independently." /><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-white p-4"><b>Content lifecycle</b><p className="text-sm text-slate-500">Draft, publish, and archive lessons/questions safely.</p></div><div className="rounded-2xl bg-white p-4"><b>Background jobs</b><p className="text-sm text-slate-500">Roadmap and AI work can run in queues and be monitored from Admin → Jobs.</p></div><div className="rounded-2xl bg-white p-4"><b>Audit trail</b><p className="text-sm text-slate-500">Key learner/admin actions are recorded for debugging and review.</p></div></div></Card>
  </PageShell>;
}
