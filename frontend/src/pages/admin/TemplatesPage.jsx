import { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import Select from '../../components/common/Select.jsx';
import Input from '../../components/common/Input.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import SectionHeader from '../../components/common/SectionHeader.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import TemplateForm from '../../components/admin/TemplateForm.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import { useAdminTemplates, useCreateTemplate, useUpdateTemplate, useUpdateTemplateStatus, useDuplicateTemplate, useArchiveTemplate } from '../../queries/adminQueries.js';

export default function TemplatesPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 8, search: '', status: '', level: '' });
  const [editing, setEditing] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(null);
  const { data, isLoading } = useAdminTemplates(filters);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const updateStatus = useUpdateTemplateStatus();
  const duplicateTemplate = useDuplicateTemplate();
  const archiveTemplate = useArchiveTemplate();
  if (isLoading) return <Loader />;
  const templates = data?.templates || [];
  const submit = (payload) => {
    if (editing) updateTemplate.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) });
    else createTemplate.mutate(payload);
  };
  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  return <PageShell>
    <PageHeader eyebrow="Admin CMS" title="Roadmap Template CMS" description="Create, edit, duplicate, publish, and archive the templates used before AI personalization." />
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card><SectionHeader title={editing ? 'Edit template' : 'Create template'} description="Modules are edited as JSON so you can learn how roadmap schemas are stored." /><div className="mt-4"><TemplateForm initialData={editing} onSubmit={submit} onCancel={editing ? () => setEditing(null) : null} isLoading={createTemplate.isPending || updateTemplate.isPending} /></div></Card>
      <Card>
        <SectionHeader title="Roadmap templates" description={`${data?.pagination?.total || 0} reusable templates.`} />
        <div className="mt-4 grid gap-3 rounded-[2rem] bg-white/70 p-4 md:grid-cols-4"><Input label="Search" value={filters.search} onChange={(e) => update('search', e.target.value)} /><Select label="Level" value={filters.level} onChange={(e) => update('level', e.target.value)}><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Select label="Status" value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="">All status</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select><div className="flex items-end"><Button type="button" variant="secondary" className="w-full" onClick={() => setFilters({ page: 1, limit: 8, search: '', status: '', level: '' })}>Reset</Button></div></div>
        <div className="mt-4 space-y-3">{templates.map((template) => <div key={template._id} className="rounded-[2rem] bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-slate-950">{template.title}</h3><p className="text-sm text-slate-500">{template.goalKey} · {template.level} · {template.modules?.length || 0} modules · {template.estimatedDurationDays} days</p></div><StatusPill status={template.status} /></div><p className="mt-2 text-sm text-slate-600">{template.description}</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="ghost" onClick={() => setEditing(template)}>Edit</Button><Button type="button" variant="secondary" onClick={() => duplicateTemplate.mutate(template._id)}>Duplicate</Button>{template.status !== 'published' && <Button type="button" variant="secondary" onClick={() => updateStatus.mutate({ id: template._id, status: 'published' })}>Publish</Button>}{template.status !== 'draft' && <Button type="button" variant="secondary" onClick={() => updateStatus.mutate({ id: template._id, status: 'draft' })}>Draft</Button>}{template.status !== 'archived' && <Button type="button" variant="secondary" onClick={() => setConfirmArchive(template)}>Archive</Button>}</div></div>)}</div>
        <PaginationControls pagination={data?.pagination} setFilters={setFilters} />
      </Card>
    </div>
    <ConfirmDialog open={Boolean(confirmArchive)} title="Archive template?" description={`This will remove “${confirmArchive?.title}” from active template selection but keep it available for audit/history.`} confirmLabel="Archive template" isLoading={archiveTemplate.isPending} onCancel={() => setConfirmArchive(null)} onConfirm={() => archiveTemplate.mutate(confirmArchive._id, { onSuccess: () => setConfirmArchive(null) })} />
  </PageShell>;
}
