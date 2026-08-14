import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, FileText, History } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { reportApi } from '../../api/reportApi.js';

const getUtcWeekStart = (value = new Date()) => {
  const date = new Date(value);
  const weekStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
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

function FocusList({ items = [] }) {
  if (!items.length) {
    return (
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Continue with the next available lesson.
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckCircle2
            size={15}
            className="mt-1 shrink-0 text-primary-strong"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ReportHistoryCard({ report }) {
  const [expanded, setExpanded] = useState(false);
  const reportDate = report.weekStart || report.createdAt;

  return (
    <article className="overflow-hidden rounded-panel border border-border bg-surface shadow-sm">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 p-4 text-left transition hover:bg-surface-secondary/45 sm:p-5"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">Weekly summary</Badge>
            <span className="text-xs font-semibold text-muted-foreground">
              Week of {formatDate(reportDate)}
            </span>
          </div>
          <p className="mt-3 font-bold text-foreground">Your week in review</p>
          {!expanded ? (
            <p className="mt-1 line-clamp-1 text-sm leading-6 text-muted-foreground">
              {report.summary}
            </p>
          ) : null}
        </div>

        <span
          className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-control border border-border bg-surface text-muted-foreground transition ${expanded ? 'rotate-180 text-primary-strong' : ''}`}
          aria-hidden="true"
        >
          <ChevronDown size={17} />
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
          <p className="text-sm leading-7 text-foreground">{report.summary}</p>
          <div className="mt-4 rounded-surface bg-surface-secondary/65 p-4">
            <p className="text-sm font-bold text-foreground">Next focus</p>
            <FocusList items={report.nextWeekFocus} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

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
    setGenerateError(null);
    try {
      await reportApi.generate();
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setGenerateError(requestError);
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
  const thisWeekReport = reports.find(
    (report) => getReportWeekKey(report) === currentWeekKey
  );
  const latestReport = reports[0] || null;
  const historyReports = reports.slice(1);
  const reportAlreadyCreated = Boolean(thisWeekReport);

  const createAction = (
    <Button
      onClick={generateReport}
      isLoading={isGenerating}
      loadingLabel="Creating report..."
      disabled={reportAlreadyCreated}
      variant={reportAlreadyCreated ? 'secondary' : 'primary'}
      className="gap-2"
    >
      {reportAlreadyCreated ? (
        <>
          <CheckCircle2 size={16} aria-hidden="true" />
          Report created this week
        </>
      ) : (
        <>
          <FileText size={16} aria-hidden="true" />
          Create weekly report
        </>
      )}
    </Button>
  );

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Weekly reports"
        eyebrowIcon={CalendarDays}
        title="Your weekly learning summaries"
        description="Reflect on what you completed, where you improved, and what to focus on next."
        actions={createAction}
      />

      <ErrorMessage message={generateError?.message} />

      {latestReport ? (
        <Card className="border-primary/10 bg-gradient-to-br from-surface via-surface to-primary-soft/25 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong"
                aria-hidden="true"
              >
                <FileText size={18} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
                  Latest weekly report
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  Your week in review
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Your most recent reflection and the priorities to carry into the next week.
                </p>
              </div>
            </div>

            <div className="shrink-0 sm:text-right">
              <Badge variant="neutral">
                Week of {formatDate(latestReport.weekStart || latestReport.createdAt)}
              </Badge>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                Created {formatDate(latestReport.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-panel border border-primary/10 bg-white/75 p-4 sm:p-5">
            <p className="text-sm leading-7 text-foreground sm:text-base">
              {latestReport.summary}
            </p>

            <div className="mt-5 rounded-surface bg-primary-soft/45 p-4">
              <p className="text-sm font-bold text-foreground">Next focus</p>
              <FocusList items={latestReport.nextWeekFocus} />
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-dashed text-center shadow-sm">
          <span
            className="mx-auto grid h-12 w-12 place-items-center rounded-surface bg-primary-soft text-primary-strong"
            aria-hidden="true"
          >
            <FileText size={21} />
          </span>
          <h2 className="mt-4 text-xl font-bold text-foreground">
            No weekly report yet
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
            Complete some learning activity, then create your first weekly summary to review your progress and next priorities.
          </p>
        </Card>
      )}

      {latestReport ? (
        <section aria-labelledby="report-history-title">
          <div className="mb-4 flex items-start gap-3">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-surface-secondary text-muted-foreground"
              aria-hidden="true"
            >
              <History size={18} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Report history
              </p>
              <h2 id="report-history-title" className="mt-1 text-xl font-bold text-foreground">
                Previous weekly summaries
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Expand an older report when you want to revisit its summary and next-focus notes.
              </p>
            </div>
          </div>

          {historyReports.length ? (
            <div className="space-y-3">
              {historyReports.map((report) => (
                <ReportHistoryCard key={report._id} report={report} />
              ))}
            </div>
          ) : (
            <div className="rounded-panel border border-dashed border-border bg-surface p-5 text-sm leading-6 text-muted-foreground">
              Older weekly summaries will appear here after future reports are created.
            </div>
          )}
        </section>
      ) : null}
    </PageShell>
  );
}
