import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, FileText } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { reportApi } from '../../api/reportApi.js';
import notify from '../../utils/notify.js';

const getUtcWeekStart = (value = new Date()) => {
  const date = new Date(value);
  const weekStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (weekStart.getUTCDay() + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);
  return weekStart;
};

const getReportWeekKey = (report) => {
  const source = report?.weekStart || report?.createdAt;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return report?._id || String(source || 'report');
  return getUtcWeekStart(date).toISOString();
};

const getUniqueWeeklyReports = (reports = []) => {
  const seenWeeks = new Set();
  return reports.filter((report) => {
    const weekKey = getReportWeekKey(report);
    if (seenWeeks.has(weekKey)) return false;
    seenWeeks.add(weekKey);
    return true;
  });
};

function ReportList({ items = [], emptyText }) {
  if (!items.length) return <p className="mt-2 text-sm leading-6 text-muted-foreground">{emptyText}</p>;

  return (
    <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-primary-strong" aria-hidden="true">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ActivitySummary({ activity = {} }) {
  const items = [
    ['Lessons', activity.lessonsCompleted || 0],
    ['Quizzes', activity.quizAttempts || 0],
    ['Practice', activity.practiceAttempts || 0],
    ['Interviews', activity.interviewAttempts || 0],
    ['Mentor questions', activity.mentorQuestions || 0]
  ];

  return (
    <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-border py-4 sm:grid-cols-5">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="text-xl font-extrabold text-foreground">{value}</p>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

function ReportDetails({ report }) {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-bold text-foreground">This week</h3>
        <ActivitySummary activity={report.activity} />
        <p className="mt-3 text-sm leading-7 text-foreground">{report.summary}</p>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <section>
          <h3 className="text-sm font-bold text-success">Your improvements</h3>
          <ReportList items={report.improvements} emptyText="Keep learning this week and your improvement signals will appear here." />
        </section>
        <section>
          <h3 className="text-sm font-bold text-warning">Needs attention</h3>
          <ReportList items={report.weakTopics} emptyText="No weak topics are currently recorded." />
        </section>
        <section>
          <h3 className="text-sm font-bold text-primary-strong">Next focus</h3>
          <ReportList items={report.nextWeekFocus} emptyText="Continue with the next available lesson." />
        </section>
      </div>
    </div>
  );
}

function ReportHistoryItem({ report }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="border-b border-border py-4 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 text-left"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <div>
          <p className="font-bold text-foreground">Week of {formatDate(report.weekStart || report.createdAt)}</p>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{report.summary}</p>
        </div>
        <ChevronDown size={17} className={`shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {expanded ? <div className="mt-4"><ReportDetails report={report} /></div> : null}
    </article>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let active = true;
    setError(null);

    reportApi.list()
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

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      await reportApi.generate();
      notify.success('Weekly report created');
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      notify.error(requestError?.message || 'Could not create your weekly report');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) return <Loader label="Loading reports..." />;

  if (error) {
    return (
      <EmptyState
        title="Weekly reports are unavailable"
        description={error.message}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }

  const reports = getUniqueWeeklyReports(data?.reports || []);
  const currentWeekKey = getUtcWeekStart().toISOString();
  const latestReport = reports[0] || null;
  const reportAlreadyCreated = reports.some((report) => getReportWeekKey(report) === currentWeekKey);

  return (
    <PageShell className="space-y-6 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Weekly reports"
        eyebrowIcon={CalendarDays}
        title="Your weekly learning summary"
        description="See what you completed, where you improved, what needs attention, and what to focus on next."
        actions={
          <Button
            onClick={generateReport}
            isLoading={isGenerating}
            loadingLabel="Creating report..."
            disabled={reportAlreadyCreated}
            variant={reportAlreadyCreated ? 'secondary' : 'primary'}
          >
            {reportAlreadyCreated ? <><CheckCircle2 size={16} aria-hidden="true" /> Report created this week</> : <><FileText size={16} aria-hidden="true" /> Create weekly report</>}
          </Button>
        }
      />

      {latestReport ? (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground">Latest report</h2>
            <Badge variant="neutral">Week of {formatDate(latestReport.weekStart || latestReport.createdAt)}</Badge>
          </div>
          <div className="mt-4"><ReportDetails report={latestReport} /></div>
        </section>
      ) : (
        <EmptyState
          title="No weekly report yet"
          description="Complete some learning activity, then create your first weekly report."
        />
      )}

      {reports.length > 1 ? (
        <section className="border-t border-border pt-5">
          <h2 className="text-lg font-bold text-foreground">Previous reports</h2>
          <div className="mt-2">
            {reports.slice(1).map((report) => <ReportHistoryItem key={report._id} report={report} />)}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
