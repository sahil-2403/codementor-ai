import { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import SectionHeader from '../../components/common/SectionHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import MetricGrid from '../../components/common/MetricGrid.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import AdminFilters from '../../components/admin/AdminFilters.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { useAdminAIUsage, useAdminAIUsageSummary } from '../../queries/adminQueries.js';

export default function AIUsagePage() {
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', status: '', feature: '' });
  const { data, isLoading } = useAdminAIUsage(filters);
  const { data: summaryData } = useAdminAIUsageSummary({ days: 7 });
  const logs = data?.logs || [];
  const summary = summaryData?.summary;
  const totals = summary?.totals || {};
  const totalTokens = totals.totalTokens ?? logs.reduce((sum, log) => sum + (log.inputTokens || 0) + (log.outputTokens || 0), 0);
  const blocked = totals.totalBlocked ?? logs.filter((log) => log.status === 'blocked').length;
  const failed = totals.totalFailed ?? logs.filter((log) => log.status === 'failed').length;
  const columns = [
    { key: 'user', header: 'User', render: (log) => <b>{log.user?.email || 'System'}</b> },
    { key: 'feature', header: 'Feature' },
    { key: 'status', header: 'Status', render: (log) => <StatusPill status={log.status} /> },
    { key: 'model', header: 'Model', render: (log) => log.model || log.provider || 'mock' },
    { key: 'tokens', header: 'Tokens', render: (log) => (log.inputTokens || 0) + (log.outputTokens || 0) },
    { key: 'sources', header: 'Sources', render: (log) => log.contextSourceCount || 0 },
    { key: 'latency', header: 'Latency', render: (log) => `${log.latencyMs || 0}ms` },
    { key: 'createdAt', header: 'Date', render: (log) => formatDate(log.createdAt) }
  ];

  if (isLoading) return <Loader />;
  return <PageShell>
    <PageHeader eyebrow="Admin AI Ops" title="AI usage logs" description="Monitor feature-level AI usage, blocked requests, context counts, latency, and rough token volume." />
    <MetricGrid columns="md:grid-cols-4">
      <Card><p className="text-sm font-bold text-slate-500">Requests / 7 days</p><h2 className="mt-2 text-3xl font-black">{totals.totalRequests ?? logs.length}</h2></Card>
      <Card><p className="text-sm font-bold text-slate-500">Approx. tokens</p><h2 className="mt-2 text-3xl font-black">{totalTokens}</h2></Card>
      <Card><p className="text-sm font-bold text-slate-500">Blocked by limits/guards</p><h2 className="mt-2 text-3xl font-black">{blocked}</h2></Card>
      <Card><p className="text-sm font-bold text-slate-500">Failed provider calls</p><h2 className="mt-2 text-3xl font-black">{failed}</h2></Card>
    </MetricGrid>
    <MetricGrid columns="md:grid-cols-3">
      <Card><SectionHeader title="Feature usage" description="Which AI features are being used most." />
        <div className="mt-3 space-y-2">{(summary?.featureBreakdown || []).slice(0, 5).map((item) => <div key={item._id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm"><span className="font-bold text-slate-700">{item._id}</span><span>{item.count} calls</span></div>)}</div>
      </Card>
      <Card><SectionHeader title="Provider health" description="Mock, fallback, Gemini, or OpenAI distribution." />
        <div className="mt-3 space-y-2">{(summary?.providerBreakdown || []).slice(0, 5).map((item) => <div key={`${item._id.provider}-${item._id.model}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm"><span className="font-bold text-slate-700">{item._id.provider}/{item._id.model}</span><span>{item.count}</span></div>)}</div>
      </Card>
      <Card><SectionHeader title="Top users" description="Useful for abuse/cost monitoring." />
        <div className="mt-3 space-y-2">{(summary?.topUsers || []).slice(0, 5).map((item) => <div key={item._id || item.user?.email} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm"><span className="font-bold text-slate-700">{item.user?.email || 'Unknown'}</span><span>{item.count} calls</span></div>)}</div>
      </Card>
    </MetricGrid>
    <Card>
      <SectionHeader title="Usage log explorer" description="Use filters to debug cost, rate limits, provider errors, and context-heavy AI calls." />
      <div className="mt-4"><AdminFilters filters={filters} setFilters={setFilters} includeTopic={false} includeFeature /></div>
      <div className="mt-4"><DataTable columns={columns} rows={logs} minWidth={920} emptyTitle="No AI logs found" emptyDescription="AI usage will appear here after roadmap, mentor, quiz, project, or interview AI calls." /></div>
      <PaginationControls pagination={data?.pagination} setFilters={setFilters} />
    </Card>
  </PageShell>;
}
