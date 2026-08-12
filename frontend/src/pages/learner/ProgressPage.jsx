import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FileText,
  RefreshCw,
  Target
} from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import CourseProgress from '../../components/progress/CourseProgress.jsx';
import { progressApi } from '../../api/progressApi.js';
import { reportApi } from '../../api/reportApi.js';
import { formatDate } from '../../utils/formatDate.js';

const formatSource = (value) =>
  String(value || 'learning activity').replaceAll('_', ' ');

function SectionHeading({ icon: Icon, eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong"
          aria-hidden="true"
        >
          <Icon size={18} />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-bold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [reportsData, setReportsData] = useState(null);
  const [reportsError, setReportsError] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [revisionError, setRevisionError] = useState(null);
  const [updatingRevision, setUpdatingRevision] = useState(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
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

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    let active = true;
    setReportsLoading(true);
    setReportsError(null);

    reportApi.list()
      .then((result) => {
        if (active) setReportsData(result);
      })
      .catch((requestError) => {
        if (active) setReportsError(requestError);
      })
      .finally(() => {
        if (active) setReportsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateRevision = async (revisionId, status) => {
    setRevisionError(null);
    setUpdatingRevision({ revisionId, status });
    try {
      await progressApi.updateRevision({ revisionId, status });
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setRevisionError(requestError);
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
  const completion = Math.max(
    0,
    Math.min(100, Number(progress.overallCompletion || 0))
  );
  const modules = data.course.modules || [];
  const totalModules = modules.length;
  const completedModules = progress.completedModules?.length || 0;
  const completedLessons =
    data.stats?.completedLessons ?? progress.completedLessons?.length ?? 0;
  const totalLessons = data.stats?.totalLessons || 0;

  const revisionPath = (item) => {
    const related = item.relatedLesson || item.relatedLessons?.[0];
    const lessonId = related?._id || related;
    return (
      item.actionPath ||
      item.path ||
      (lessonId ? `/lessons/${lessonId}` : '/roadmap')
    );
  };

  const isUpdating = (item, status) =>
    updatingRevision?.revisionId === item._id && updatingRevision?.status === status;

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Progress"
        eyebrowIcon={BarChart3}
        title="Your learning progress"
        description="Understand your course completion, performance, weak areas, and revision progress."
        actions={
          <Link
            to="/reports"
            className="ui-button ui-button--secondary min-h-9 gap-2 px-3.5 text-xs sm:text-sm"
          >
            <FileText size={15} aria-hidden="true" />
            Weekly reports
          </Link>
        }
      />

      <CourseProgress
        variant="detailed"
        value={completion}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        completedModules={completedModules}
        totalModules={totalModules}
        modules={modules}
        completedLessonIds={progress.completedLessons || []}
        collapsible
        defaultExpanded={false}
      />

      <Card className="shadow-sm">
        <SectionHeading
          icon={ClipboardCheck}
          eyebrow="Learning performance"
          title="Quiz performance"
          description="A summary of your results across completed quiz attempts."
        />

        <div className="mt-5 grid overflow-hidden rounded-panel border border-border bg-surface-secondary/45 sm:grid-cols-3">
          <div className="p-4 sm:p-5">
            <p className="text-sm font-semibold text-muted-foreground">Quiz attempts</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">{progress.quizStats?.totalAttempts || 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Completed attempts</p>
          </div>
          <div className="border-t border-border p-4 sm:border-l sm:border-t-0 sm:p-5">
            <p className="text-sm font-semibold text-muted-foreground">Average score</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-primary-strong">{progress.quizStats?.averageScore || 0}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Across your quizzes</p>
          </div>
          <div className="border-t border-border p-4 sm:border-l sm:border-t-0 sm:p-5">
            <p className="text-sm font-semibold text-muted-foreground">Best score</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">{progress.quizStats?.bestScore || 0}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Highest quiz result</p>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <SectionHeading
          icon={Target}
          eyebrow="Topics to improve"
          title="Where to focus next"
          description="These topics were detected from your supported quizzes, reviews, and practice attempts."
          action={<Badge variant="neutral">{weakTopics.length} topics</Badge>}
        />

        {weakTopics.length ? (
          <div className="mt-5 divide-y divide-border overflow-hidden rounded-panel border border-border">
            {weakTopics.map((item) => {
              const evidence = [
                `From ${formatSource(item.source)}`,
                `Detected ${item.attempts || 1} time${Number(item.attempts || 1) === 1 ? '' : 's'}`,
                item.score !== undefined && item.score !== null && Number.isFinite(Number(item.score))
                  ? `Latest score ${item.score}%`
                  : null
              ].filter(Boolean);

              return (
                <div key={item.topic} className="flex flex-col gap-3 bg-surface px-4 py-4 transition hover:bg-surface-secondary/45 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-foreground">{item.topic}</p>
                      <StatusPill status={item.severity || 'medium'} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{evidence.join(' · ')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-panel border border-dashed border-border bg-surface-secondary/55 p-5 text-sm leading-6 text-muted-foreground">
            No topics currently need extra attention. Keep completing lessons and quizzes to build more evidence.
          </div>
        )}
      </Card>

      <Card className="shadow-sm">
        <SectionHeading
          icon={RefreshCw}
          eyebrow="Revision planner"
          title="Topics ready for review"
          description="Open due revision material, skip it for now, or mark it complete when you feel confident."
          action={<Badge variant={dueRevisions.length ? 'warning' : 'neutral'}>{dueRevisions.length} due</Badge>}
        />

        <div className="mt-4"><ErrorMessage message={revisionError?.message} /></div>

        <div className="mt-5 space-y-3">
          {dueRevisions.length ? (
            dueRevisions.map((item) => (
              <div key={item._id} className="rounded-panel border border-border bg-surface-secondary/55 p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-foreground">{item.topic}</p>
                      <StatusPill status={item.priority || 'medium'} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reason || 'This topic is ready for another review.'}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link to={revisionPath(item)} className="ui-button ui-button--secondary min-h-9 px-3.5 text-xs sm:text-sm">Open</Link>
                    <Button
                      variant="secondary"
                      className="min-h-9 px-3.5 text-xs sm:text-sm"
                      onClick={() => updateRevision(item._id, 'skipped')}
                      isLoading={isUpdating(item, 'skipped')}
                      loadingLabel="Skipping..."
                      disabled={Boolean(updatingRevision && updatingRevision.revisionId === item._id)}
                    >
                      Skip
                    </Button>
                    <Button
                      className="min-h-9 px-3.5 text-xs sm:text-sm"
                      onClick={() => updateRevision(item._id, 'completed')}
                      isLoading={isUpdating(item, 'completed')}
                      loadingLabel="Saving..."
                      disabled={Boolean(updatingRevision && updatingRevision.revisionId === item._id)}
                    >
                      Mark done
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-panel border border-dashed border-border bg-surface-secondary/55 p-5 text-sm leading-6 text-muted-foreground">
              You are caught up. New revision tasks will appear as you complete more lessons and quizzes.
            </div>
          )}
        </div>
      </Card>

      <Card className="border-primary/10 bg-gradient-to-br from-surface via-surface to-primary-soft/25 shadow-sm">
        <SectionHeading
          icon={FileText}
          eyebrow="Latest weekly report"
          title="Your week in review"
          description="A quick reflection on your latest weekly learning summary."
          action={
            <Link to="/reports" className="ui-button ui-button--secondary min-h-9 gap-2 px-3.5 text-xs sm:text-sm">
              View all reports
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />

        {reportsLoading ? (
          <div className="mt-5 rounded-panel border border-border bg-surface/70 p-5 text-sm text-muted-foreground">Loading your latest weekly report...</div>
        ) : reportsError ? (
          <div className="mt-5 rounded-panel border border-border bg-surface/70 p-5 text-sm leading-6 text-muted-foreground">The latest weekly report could not be loaded right now. Open Weekly Reports to try again.</div>
        ) : latestReport ? (
          <div className="mt-5 rounded-panel border border-primary/10 bg-white/75 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="neutral">Weekly summary</Badge>
              <time className="text-sm font-semibold text-muted-foreground" dateTime={latestReport.createdAt}>{formatDate(latestReport.createdAt)}</time>
            </div>

            <p className="mt-4 text-sm leading-7 text-foreground sm:text-base">{latestReport.summary}</p>

            <div className="mt-5 rounded-surface bg-primary-soft/45 p-4">
              <p className="text-sm font-bold text-foreground">Next focus</p>
              {latestReport.nextWeekFocus?.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  {latestReport.nextWeekFocus.map((item) => (
                    <li key={item} className="flex gap-2"><span className="text-primary-strong" aria-hidden="true">•</span><span>{item}</span></li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Continue with the next available lesson.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-panel border border-dashed border-border bg-surface/70 p-5">
            <p className="font-bold text-foreground">No weekly report yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Complete some learning activity, then open Weekly Reports to create your first summary.</p>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
