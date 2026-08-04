import { Link, useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import MetricGrid from '../../components/common/MetricGrid.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import WeakTopicsCard from '../../components/dashboard/WeakTopicsCard.jsx';
import ProgressChart from '../../components/dashboard/ProgressChart.jsx';
import { useDashboard } from '../../queries/dashboardQueries.js';
import { useUpdateRevision } from '../../queries/progressQueries.js';

export default function ProgressPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDashboard();
  const updateRevision = useUpdateRevision();

  if (isLoading) return <Loader label="Loading progress..." />;
  if (error) return <EmptyState title="Progress is unavailable" description={error.message} actionLabel="Try again" onAction={() => refetch()} />;
  if (!data?.course || !data?.progress) return <EmptyState title="No progress to show yet" description="Start your roadmap and complete a lesson to begin tracking progress." actionLabel="Open dashboard" onAction={() => navigate('/dashboard')} />;

  const progress = data.progress;
  const dueRevisions = data.dueRevisions || [];
  const revisionStats = data.revisionStats || {};
  const recommendations = data.recommendations || [];

  const revisionPath = (item) => {
    const related = item.relatedLesson || item.relatedLessons?.[0];
    const lessonId = related?._id || related;
    return item.actionPath || item.path || (lessonId ? `/lessons/${lessonId}` : '/roadmap');
  };

  const isUpdating = (item, status) => updateRevision.isPending
    && updateRevision.variables?.revisionId === item._id
    && updateRevision.variables?.status === status;

  return <PageShell>
    <PageHeader eyebrow="Progress" title="Your learning progress" description="Track completed lessons, quiz performance, topics to improve, and revision tasks." actions={<Link to="/reports" className="ui-button ui-button--secondary">Weekly reports</Link>} />

    <MetricGrid>
      <StatCard title="Quiz attempts" value={progress.quizStats?.totalAttempts || 0} subtitle="Quizzes completed" />
      <StatCard title="Average score" value={`${progress.quizStats?.averageScore || 0}%`} subtitle="Across your quizzes" />
      <StatCard title="Best score" value={`${progress.quizStats?.bestScore || 0}%`} subtitle="Your highest quiz result" />
      <StatCard title="Revisions due" value={revisionStats.pending || 0} subtitle="Ready to review" />
    </MetricGrid>

    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <ProgressChart value={progress.overallCompletion || 0} completed={data.stats?.completedLessons} total={data.stats?.totalLessons} />
      <Card>
        <h2 className="text-xl font-bold text-foreground">Revision planner</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Review the topics that are due and mark them complete when you feel confident.</p>
        <div className="mt-4"><ErrorMessage message={updateRevision.error?.message} /></div>
        <div className="mt-5 space-y-3">
          {dueRevisions.length ? dueRevisions.map((item) => <div key={item._id} className="rounded-surface border border-border bg-surface-secondary p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{item.topic}</p><StatusPill status={item.priority || 'medium'} /></div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.reason || 'This topic is ready for another review.'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={revisionPath(item)} className="ui-button ui-button--secondary">Open</Link>
                <Button variant="secondary" onClick={() => updateRevision.mutate({ revisionId: item._id, status: 'skipped' })} isLoading={isUpdating(item, 'skipped')} loadingLabel="Skipping..." disabled={updateRevision.isPending && updateRevision.variables?.revisionId === item._id}>Skip</Button>
                <Button onClick={() => updateRevision.mutate({ revisionId: item._id, status: 'completed' })} isLoading={isUpdating(item, 'completed')} loadingLabel="Saving..." disabled={updateRevision.isPending && updateRevision.variables?.revisionId === item._id}>Mark done</Button>
              </div>
            </div>
          </div>) : <p className="rounded-surface bg-surface-secondary p-4 text-sm leading-6 text-muted-foreground">You are caught up. New revision tasks will appear as you complete more lessons and quizzes.</p>}
        </div>
      </Card>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <WeakTopicsCard topics={progress.weakTopics || []} />
      <Card>
        <h2 className="text-xl font-bold text-foreground">Recommended actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Useful next steps based on your current progress.</p>
        <div className="mt-5 space-y-3">
          {recommendations.length ? recommendations.map((item, index) => <Link key={`${item.title}-${index}`} to={item.actionPath || '/roadmap'} className="block rounded-surface border border-border bg-surface p-4 transition hover:border-primary/30 hover:bg-surface-secondary">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{item.title}</p><StatusPill status={item.priority || 'medium'} /></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p></div><span className="auth-link shrink-0 text-sm">Open →</span></div>
          </Link>) : <p className="rounded-surface bg-surface-secondary p-4 text-sm leading-6 text-muted-foreground">No recommended action is available yet.</p>}
        </div>
      </Card>
    </div>
  </PageShell>;
}
