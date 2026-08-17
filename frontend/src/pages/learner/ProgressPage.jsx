import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, FileText } from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import CourseProgress from '../../components/progress/CourseProgress.jsx';
import { progressApi } from '../../api/progressApi.js';
import { reportApi } from '../../api/reportApi.js';
import { formatDate } from '../../utils/formatDate.js';
import notify from '../../utils/notify.js';

const formatSource = (value) => String(value || 'learning activity').replaceAll('_', ' ');

export default function ProgressPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [reportsData, setReportsData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [updatingRevision, setUpdatingRevision] = useState(null);

  useEffect(() => {
    let active = true;
    setError(null);

    progressApi.dashboard()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [loadAttempt]);

  useEffect(() => {
    let active = true;
    reportApi.list()
      .then((result) => {
        if (active) setReportsData(result);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReportsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const updateRevision = async (revisionId, status) => {
    setUpdatingRevision({ revisionId, status });
    try {
      await progressApi.updateRevision({ revisionId, status });
      notify.success(status === 'completed' ? 'Revision marked complete' : 'Revision skipped for now');
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      notify.error(requestError?.message || 'Could not update this revision');
    } finally {
      setUpdatingRevision(null);
    }
  };

  if (isLoading) return <Loader label="Loading progress..." />;

  if (error) {
    return (
      <EmptyState
        title="Progress is unavailable"
        description={error.message}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }

  if (!data?.course || !data?.progress) {
    return (
      <EmptyState
        title="No progress to show yet"
        description="Start your roadmap and complete a lesson to begin tracking progress."
        actionLabel="Open dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const progress = data.progress;
  const dueRevisions = data.dueRevisions || [];
  const weakTopics = progress.weakTopics || [];
  const latestReport = reportsData?.reports?.[0] || null;
  const completion = Math.max(0, Math.min(100, Number(progress.overallCompletion || 0)));
  const completedLessons = data.stats?.completedLessons ?? progress.completedLessons?.length ?? 0;
  const totalLessons = data.stats?.totalLessons || 0;

  const revisionPath = (item) => {
    const related = item.relatedLesson || item.relatedLessons?.[0];
    const lessonId = related?._id || related;
    return item.actionPath || item.path || (lessonId ? `/lessons/${lessonId}` : '/roadmap');
  };

  const isUpdating = (item, status) =>
    updatingRevision?.revisionId === item._id && updatingRevision?.status === status;

  return (
    <PageShell className="space-y-6 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Progress"
        eyebrowIcon={BarChart3}
        title="Your learning progress"
        description="Track completion, quiz results, topics to improve, and revisions that are ready for you."
        actions={
          <Link to="/reports" className="ui-button ui-button--secondary min-h-9 gap-2 px-3.5 text-xs sm:text-sm">
            <FileText size={15} aria-hidden="true" /> Weekly reports
          </Link>
        }
      />

      <CourseProgress
        variant="compact"
        value={completion}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
      />

      <section>
        <h2 className="text-lg font-bold text-foreground">Quiz performance</h2>
        <div className="mt-3 grid grid-cols-3 border-y border-border py-4 text-center sm:text-left">
          <div>
            <p className="text-xl font-extrabold text-foreground">{progress.quizStats?.totalAttempts || 0}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Attempts</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-primary-strong">{progress.quizStats?.averageScore || 0}%</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Average</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-foreground">{progress.quizStats?.bestScore || 0}%</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Best score</p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">Topics to improve</h2>
          <Badge variant="neutral">{weakTopics.length}</Badge>
        </div>
        {weakTopics.length ? (
          <div className="mt-2 divide-y divide-border border-y border-border">
            {weakTopics.map((item) => (
              <div key={item.topic} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{item.topic}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    From {formatSource(item.source)}{Number.isFinite(Number(item.score)) ? ` · Latest score ${item.score}%` : ''}
                  </p>
                </div>
                <StatusPill status={item.severity || 'medium'} />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">No topics currently need extra attention.</p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">Revisions ready</h2>
          <Badge variant={dueRevisions.length ? 'warning' : 'neutral'}>{dueRevisions.length} due</Badge>
        </div>

        {dueRevisions.length ? (
          <div className="mt-2 divide-y divide-border border-y border-border">
            {dueRevisions.map((item) => (
              <div key={item._id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{item.topic}</p>
                    <StatusPill status={item.priority || 'medium'} />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.reason || 'This topic is ready for another review.'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={revisionPath(item)} className="ui-button ui-button--secondary min-h-9 px-3 text-xs">Open</Link>
                  <Button
                    variant="secondary"
                    className="min-h-9 px-3 text-xs"
                    onClick={() => updateRevision(item._id, 'skipped')}
                    isLoading={isUpdating(item, 'skipped')}
                    loadingLabel="Skipping..."
                    disabled={Boolean(updatingRevision && updatingRevision.revisionId === item._id)}
                  >
                    Skip
                  </Button>
                  <Button
                    className="min-h-9 px-3 text-xs"
                    onClick={() => updateRevision(item._id, 'completed')}
                    isLoading={isUpdating(item, 'completed')}
                    loadingLabel="Saving..."
                    disabled={Boolean(updatingRevision && updatingRevision.revisionId === item._id)}
                  >
                    Mark done
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">You are caught up. New revisions will appear as you continue learning.</p>
        )}
      </section>

      <section className="border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">Latest weekly report</h2>
          <Link to="/reports" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-strong">
            View reports <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        {reportsLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">Loading latest report...</p>
        ) : latestReport ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground">Week of {formatDate(latestReport.weekStart || latestReport.createdAt)}</p>
            <p className="mt-2 text-sm leading-7 text-foreground">{latestReport.summary}</p>
            {latestReport.nextWeekFocus?.length ? (
              <p className="mt-2 text-sm text-muted-foreground">Next: {latestReport.nextWeekFocus.slice(0, 2).join(' · ')}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">No weekly report yet. Create one after you have some learning activity this week.</p>
        )}
      </section>
    </PageShell>
  );
}
