import { Link, useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import MetricGrid from '../../components/common/MetricGrid.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import WeakTopicsCard from '../../components/dashboard/WeakTopicsCard.jsx';
import ProgressChart from '../../components/dashboard/ProgressChart.jsx';
import { useDashboard } from '../../queries/dashboardQueries.js';
import { useUpdateRevision } from '../../queries/progressQueries.js';

export default function ProgressPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useDashboard();
  const updateRevision = useUpdateRevision();
  if (isLoading) return <Loader label="Loading progress..." />;
  const progress = data?.progress;
  const dueRevisions = data?.dueRevisions || [];
  const revisionStats = data?.revisionStats || {};
  const recommendations = data?.recommendations || [];

  return <PageShell>
    <PageHeader eyebrow="Analytics" title="Your learning progress" description="Track completion, quiz performance, weak-topic severity, and revision workload." />

    <MetricGrid columns="md:grid-cols-4">
      <StatCard title="Quiz attempts" value={progress?.quizStats?.totalAttempts || 0} />
      <StatCard title="Average score" value={`${progress?.quizStats?.averageScore || 0}%`} />
      <StatCard title="Best score" value={`${progress?.quizStats?.bestScore || 0}%`} />
      <StatCard title="Pending revisions" value={revisionStats.pending || 0} />
    </MetricGrid>

    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <ProgressChart value={progress?.overallCompletion || 0} completed={data?.stats?.completedLessons} total={data?.stats?.totalLessons} />
      <Card>
        <h2 className="text-xl font-black text-slate-950">Revision planner</h2>
        <p className="mt-1 text-sm text-slate-500">Generated automatically when a weak topic is detected.</p>
        <div className="mt-5 space-y-3">
          {dueRevisions.length ? dueRevisions.map((item) => <div key={item._id} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><p className="font-black text-slate-900">{item.topic}</p><Badge className="bg-indigo-50 text-indigo-700">{item.priority}</Badge></div>
                <p className="mt-1 text-sm text-slate-500">{item.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => navigate(item.actionPath || item.path || (item.relatedLesson ? `/lessons/${item.relatedLesson}` : '/roadmap'))}>Open</Button>
                <Button variant="secondary" disabled={updateRevision.isPending && updateRevision.variables?.revisionId === item._id} onClick={() => updateRevision.mutate({ revisionId: item._id, status: 'skipped' })}>{updateRevision.isPending && updateRevision.variables?.revisionId === item._id ? 'Updating...' : 'Skip'}</Button>
                <Button disabled={updateRevision.isPending && updateRevision.variables?.revisionId === item._id} onClick={() => updateRevision.mutate({ revisionId: item._id, status: 'completed' })}>{updateRevision.isPending && updateRevision.variables?.revisionId === item._id ? 'Updating...' : 'Done'}</Button>
              </div>
            </div>
          </div>) : <p className="text-sm text-slate-500">No revision is due today. New revision items will appear after quizzes or mentor interactions.</p>}
        </div>
      </Card>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <WeakTopicsCard topics={progress?.weakTopics || []} />
      <Card>
        <h2 className="text-xl font-black text-slate-950">Recommended actions</h2>
        <div className="mt-5 space-y-3">
          {recommendations.map((item) => <Link key={item.title} to={item.actionPath} className="block rounded-2xl bg-white/70 p-4 transition hover:-translate-y-0.5 hover:shadow-soft"><div className="flex items-center justify-between gap-4"><div><p className="font-black text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.description}</p></div><span className="text-sm font-black text-indigo-700">Open →</span></div></Link>)}
        </div>
      </Card>
    </div>
  </PageShell>;
}
