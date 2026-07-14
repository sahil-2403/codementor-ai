import { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Loader from '../../components/common/Loader.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import { useAdminJobs } from '../../queries/adminQueries.js';
import { formatDate } from '../../utils/formatDate.js';

export default function JobsPage() {
  const [params, setParams] = useState({ page: 1, limit: 10, status: '', type: '', search: '', sortBy: 'createdAt', sortOrder: 'desc' });
  const { data, isLoading } = useAdminJobs(params);
  const jobs = data?.jobs || [];
  const pagination = data?.pagination;
  const update = (patch) => setParams((prev) => ({ ...prev, page: 1, ...patch }));
  const columns = [
    { key: 'type', header: 'Type', render: (job) => <b>{String(job.type).replaceAll('_', ' ')}</b> },
    { key: 'status', header: 'Status', render: (job) => <StatusPill status={job.status} /> },
    { key: 'user', header: 'User', render: (job) => <div>{job.user?.name || 'System'}<br/><span className="text-xs text-slate-500">{job.user?.email}</span></div> },
    { key: 'attempts', header: 'Attempts', render: (job) => job.attempts || 0 },
    { key: 'createdAt', header: 'Created', render: (job) => formatDate(job.createdAt) },
    { key: 'output', header: 'Output/Error', render: (job) => <pre className="max-h-24 max-w-md overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{job.error || JSON.stringify(job.output || {}, null, 2)}</pre> }
  ];

  return <PageShell>
    <PageHeader eyebrow="Backend observability" title="Background jobs" description="Monitor queue-backed AI and roadmap work. Long-running operations are visible instead of hidden inside API requests." />
    <Card><div className="grid gap-3 md:grid-cols-4"><Input label="Search" value={params.search} onChange={(e) => update({ search: e.target.value })} /><Select label="Status" value={params.status} onChange={(e) => update({ status: e.target.value })}><option value="">All statuses</option><option value="queued">Queued</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option></Select><Select label="Type" value={params.type} onChange={(e) => update({ type: e.target.value })}><option value="">All job types</option><option value="roadmap_generation">Roadmap generation</option><option value="weekly_report">Weekly report</option><option value="embedding_generation">Embedding generation</option></Select><Select label="Sort" value={`${params.sortBy}:${params.sortOrder}`} onChange={(e) => { const [sortBy, sortOrder] = e.target.value.split(':'); update({ sortBy, sortOrder }); }}><option value="createdAt:desc">Newest first</option><option value="createdAt:asc">Oldest first</option><option value="status:asc">Status</option></Select></div></Card>
    <Card>
      <DataTable columns={columns} rows={jobs} isLoading={isLoading} emptyTitle="No jobs found" emptyDescription="Roadmap generation or weekly report jobs will appear here." minWidth={900} />
      <PaginationControls pagination={pagination} onPageChange={(page) => setParams({ ...params, page })} />
    </Card>
  </PageShell>;
}
