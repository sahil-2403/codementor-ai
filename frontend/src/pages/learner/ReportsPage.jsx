import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { useGenerateReport, useReports } from '../../queries/reportQueries.js';

export default function ReportsPage() {
  const { data, isLoading, error, refetch } = useReports();
  const generate = useGenerateReport();

  if (isLoading) return <Loader label="Loading reports..." />;
  if (error) return <EmptyState title="Weekly reports are unavailable" description={error.message} actionLabel="Try again" onAction={() => refetch()} />;

  const reports = data?.reports || [];

  return <PageShell>
    <PageHeader
      eyebrow="Weekly reports"
      title="Weekly progress summaries"
      description="Each report uses actual recorded learning statistics. Gemini may improve the wording when available; the deterministic fallback remains a progress summary."
      actions={<Button onClick={() => generate.mutate()} isLoading={generate.isPending} loadingLabel="Generating report...">Generate report</Button>}
    />
    <ErrorMessage message={generate.error?.message} />

    {reports.length ? <div className="grid gap-5 lg:grid-cols-2">
      {reports.map((report) => <Card key={report._id}>
        <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="neutral">Weekly progress summary</Badge><time className="text-sm font-semibold text-muted-foreground" dateTime={report.createdAt}>{formatDate(report.createdAt)}</time></div>
        <h2 className="mt-4 text-xl font-bold text-foreground">Recorded learning activity</h2>
        <p className="mt-2 leading-7 text-muted-foreground">{report.summary}</p>
        <div className="mt-5 rounded-surface bg-surface-secondary p-4">
          <p className="text-sm font-semibold text-foreground">Next focus</p>
          {report.nextWeekFocus?.length ? <ul className="mt-2 space-y-2 text-sm text-muted-foreground">{report.nextWeekFocus.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Continue the next available lesson.</p>}
        </div>
      </Card>)}
    </div> : <Card className="text-center">
      <h2 className="text-xl font-bold text-foreground">No weekly reports yet</h2>
      <p className="mx-auto mt-2 max-w-xl leading-7 text-muted-foreground">Generate a report after completing learning activity. The summary will use the progress currently stored for your active roadmap.</p>
      <Button className="mt-5" onClick={() => generate.mutate()} isLoading={generate.isPending} loadingLabel="Generating report...">Generate first report</Button>
    </Card>}
  </PageShell>;
}
