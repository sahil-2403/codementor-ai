import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { useGenerateReport, useReports } from '../../queries/reportQueries.js';

export default function ReportsPage() {
  const { data, isLoading } = useReports();
  const generate = useGenerateReport();
  if (isLoading) return <Loader label="Loading reports..." />;
  return <div className="space-y-5"><div className="flex items-end justify-between"><div><p className="font-bold text-indigo-600">Weekly reports</p><h1 className="text-4xl font-black">AI progress summaries</h1></div><Button onClick={() => generate.mutate()} disabled={generate.isPending}>{generate.isPending ? 'Generating...' : 'Generate report'}</Button></div>{data?.reports?.length ? data.reports.map((report) => <Card key={report._id}><p className="text-sm font-bold text-slate-500">{formatDate(report.createdAt)}</p><h3 className="mt-2 text-xl font-black">Weekly summary</h3><p className="mt-2 text-slate-700">{report.summary}</p><p className="mt-4 font-bold">Next focus: {report.nextWeekFocus?.join(', ') || 'Continue current module'}</p></Card>) : <Card>No reports yet. Generate your first report.</Card>}</div>;
}
