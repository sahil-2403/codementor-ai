import { useState } from 'react';
import AdminLifecycleGuide from '../../components/admin/AdminLifecycleGuide.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import TemplateForm from '../../components/admin/TemplateForm.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import SectionHeader from '../../components/common/SectionHeader.jsx';
import Select from '../../components/common/Select.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { useAdminTemplates, useArchiveTemplate, useCreateTemplate, useDuplicateTemplate, useUpdateTemplate, useUpdateTemplateStatus } from '../../queries/adminQueries.js';

const emptyFilters = { page: 1, limit: 8, search: '', status: '', level: '' };

export default function TemplatesPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [editing, setEditing] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const { data, isLoading } = useAdminTemplates(filters);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const updateStatus = useUpdateTemplateStatus();
  const duplicateTemplate = useDuplicateTemplate();
  const archiveTemplate = useArchiveTemplate();

  if (isLoading) return <Loader label="Loading roadmap templates..." />;

  const templates = data?.templates || [];
  const errorMessage = createTemplate.error?.message || updateTemplate.error?.message || updateStatus.error?.message || duplicateTemplate.error?.message || archiveTemplate.error?.message;
  const submit = (payload) => {
    if (editing) updateTemplate.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) });
    else createTemplate.mutate(payload);
  };
  const update = (key, value) => setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));

  return <PageShell>
    <PageHeader eyebrow="Admin CMS" title="Roadmap template CMS" description="Maintain one validated published template for each goal and level combination." />
    <AdminLifecycleGuide />
    <ErrorMessage message={errorMessage} />
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <SectionHeader title={editing ? 'Edit template' : 'Create template draft'} description="Publishing resolves lesson slugs and quiz tags against published content and validates module ordering." />
        <div className="mt-4"><TemplateForm initialData={editing} onSubmit={submit} onCancel={editing ? () => setEditing(null) : null} isLoading={createTemplate.isPending || updateTemplate.isPending} /></div>
      </Card>
      <Card>
        <SectionHeader title="Roadmap templates" description={`${data?.pagination?.total || 0} reusable templates.`} />
        <div className="mt-4 grid gap-3 rounded-panel bg-surface-secondary p-4 md:grid-cols-4">
          <Input label="Search" value={filters.search} onChange={(event) => update('search', event.target.value)} />
          <Select label="Level" value={filters.level} onChange={(event) => update('level', event.target.value)}><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
          <Select label="Status" value={filters.status} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select>
          <div className="flex items-end"><Button type="button" variant="secondary" className="w-full" onClick={() => setFilters(emptyFilters)}>Reset</Button></div>
        </div>

        <div className="mt-4 space-y-3">
          {templates.length ? templates.map((template) => <article key={template._id} className="rounded-panel border border-border bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-foreground">{template.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{template.goalKey} · {template.level} · {template.modules?.length || 0} modules · {template.estimatedDurationDays} days</p>
              </div>
              <StatusPill status={template.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{template.description || 'No description added.'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {template.status !== 'archived' ? <Button type="button" variant="ghost" onClick={() => setEditing(template)}>Edit</Button> : null}
              <Button type="button" variant="secondary" isLoading={duplicateTemplate.isPending && duplicateTemplate.variables === template._id} loadingLabel="Duplicating..." onClick={() => duplicateTemplate.mutate(template._id)}>Duplicate</Button>
              {template.status === 'draft' ? <Button type="button" variant="secondary" onClick={() => setPublishTarget(template)}>Publish</Button> : null}
              {template.status !== 'archived' ? <Button type="button" variant="secondary" onClick={() => setArchiveTarget(template)}>Archive</Button> : null}
            </div>
          </article>) : <EmptyState title="No roadmap templates found" description="Create a template draft or adjust the filters." />}
        </div>
        <PaginationControls pagination={data?.pagination} setFilters={setFilters} />
      </Card>
    </div>

    <ConfirmDialog
      open={Boolean(publishTarget)}
      title="Publish roadmap template?"
      description={`Publish “${publishTarget?.title}” after every lesson slug, quiz tag, module order, and goal-level uniqueness rule passes validation.`}
      confirmLabel="Publish template"
      tone="primary"
      isLoading={updateStatus.isPending}
      onCancel={() => setPublishTarget(null)}
      onConfirm={() => updateStatus.mutate({ id: publishTarget._id, status: 'published', confirmPublish: true }, { onSuccess: () => setPublishTarget(null) })}
    />
    <ConfirmDialog
      open={Boolean(archiveTarget)}
      title="Archive roadmap template?"
      description={`This removes “${archiveTarget?.title}” from active template selection and preserves it as read-only history.`}
      confirmLabel="Archive template"
      isLoading={archiveTemplate.isPending}
      onCancel={() => setArchiveTarget(null)}
      onConfirm={() => archiveTemplate.mutate(archiveTarget._id, { onSuccess: () => setArchiveTarget(null) })}
    />
  </PageShell>;
}
