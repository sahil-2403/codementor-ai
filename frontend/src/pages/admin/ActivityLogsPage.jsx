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
import { useAdminActivityLogs } from '../../queries/adminQueries.js';
import { formatDate } from '../../utils/formatDate.js';

export default function ActivityLogsPage() {
  const [params, setParams] = useState({ page: 1, limit: 10, severity: '', entityType: '', search: '', sortBy: 'createdAt', sortOrder: 'desc' });
  const { data, isLoading } = useAdminActivityLogs(params);
  const logs = data?.logs || [];
  const pagination = data?.pagination;
  const update = (patch) => setParams((prev) => ({ ...prev, page: 1, ...patch }));
  const columns = [
    { key: 'severity', header: 'Severity', render: (log) => <StatusPill status={log.severity} /> },
    { key: 'action', header: 'Action', render: (log) => <div><b>{log.action}</b><p className="text-xs text-slate-500">{log.entityType}</p></div> },
    { key: 'message', header: 'Message', render: (log) => <p className="max-w-sm text-sm text-slate-600">{log.message || 'No message recorded.'}</p> },
    { key: 'user', header: 'User', render: (log) => <div>{log.user?.name || 'System'}<br/><span className="text-xs text-slate-500">{log.user?.email || 'no user'}</span></div> },
    { key: 'metadata', header: 'Metadata', render: (log) => <pre className="max-h-24 max-w-xs overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{JSON.stringify(log.metadata || {}, null, 2)}</pre> },
    { key: 'createdAt', header: 'Date', render: (log) => formatDate(log.createdAt) }
  ];

  return <PageShell>
    <PageHeader eyebrow="Audit trail" title="Activity logs" description="Track important user, admin, AI, quiz, roadmap, and content-management actions for debugging and auditability." />
    <Card><div className="grid gap-3 md:grid-cols-4"><Input label="Search" value={params.search} onChange={(e) => update({ search: e.target.value })} /><Select label="Severity" value={params.severity} onChange={(e) => update({ severity: e.target.value })}><option value="">All severities</option><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></Select><Input label="Entity type" value={params.entityType} onChange={(e) => update({ entityType: e.target.value })} /><Select label="Sort" value={`${params.sortBy}:${params.sortOrder}`} onChange={(e) => { const [sortBy, sortOrder] = e.target.value.split(':'); update({ sortBy, sortOrder }); }}><option value="createdAt:desc">Newest first</option><option value="createdAt:asc">Oldest first</option><option value="action:asc">Action</option></Select></div></Card>
    <Card>
      {isLoading ? <Loader label="Loading activity logs..." /> : <DataTable columns={columns} rows={logs} emptyTitle="No activity logs found" emptyDescription="Learner/admin actions will appear here after using the app." minWidth={1050} />}
      <PaginationControls pagination={pagination} onPageChange={(page) => setParams({ ...params, page })} />
    </Card>
  </PageShell>;
}
