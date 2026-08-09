import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ClipboardCheck, Map, Pencil, Plus, Trash2 } from 'lucide-react';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { getRoadmapTemplateGoalLabel } from '../../constants/roadmapTemplateGoals.js';
import { useAdminTemplates, useDeleteTemplate, useUpdateTemplateStatus } from '../../queries/adminQueries.js';

const emptyFilters = { page: 1, limit: 8, search: '', status: '', level: '' };

export default function TemplatesPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [publishTarget, setPublishTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const templatesQuery = useAdminTemplates(filters);
  const updateStatus = useUpdateTemplateStatus();
  const deleteTemplate = useDeleteTemplate();

  if (templatesQuery.isLoading) return <Loader label="Loading roadmap templates..." />;

  const templates = templatesQuery.data?.templates || [];
  const update = (key, value) => setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));

  const openPublish = (template) => {
    updateStatus.reset();
    setPublishTarget(template);
  };

  const openArchive = (template) => {
    updateStatus.reset();
    setArchiveTarget(template);
  };

  const openDelete = (template) => {
    deleteTemplate.reset();
    setDeleteConfirmation('');
    setDeleteTarget(template);
  };

  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleteConfirmation('');
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Content administration"
        eyebrowIcon={Map}
        title="Roadmap templates"
        description="Manage the reusable learning sequences used when new learner roadmaps are created."
        actions={
          <Link to="/admin/templates/new" className="ui-button ui-button--primary gap-2">
            <Plus size={16} aria-hidden="true" />
            Create template
          </Link>
        }
      />

      <ErrorMessage message={templatesQuery.error?.message} />

      <Card className="shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Template library</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">Learning-path roadmaps</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{templatesQuery.data?.pagination?.total || 0} template(s) match the current filters.</p>
          </div>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">Drafts can be edited freely. Published templates are used for future roadmap generation. Archive a published template before deleting it permanently.</p>
        </div>

        <div className="mt-5 grid gap-3 rounded-panel border border-border bg-surface-secondary/45 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto]">
          <Input label="Search" placeholder="Template title or description" value={filters.search} onChange={(event) => update('search', event.target.value)} />
          <Select label="Level" value={filters.level} onChange={(event) => update('level', event.target.value)}>
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
          <Select label="Status" value={filters.status} onChange={(event) => update('status', event.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
          <div className="flex items-end">
            <Button type="button" variant="secondary" className="w-full xl:w-auto" onClick={() => setFilters(emptyFilters)}>Reset</Button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {templates.length ? templates.map((template) => {
            const modules = template.modules || [];
            const calculatedDurationDays = modules.reduce((sum, module) => sum + (Number(module.durationDays) || 0), 0);
            const canDelete = template.status !== 'published';

            return (
              <article key={template._id} className="rounded-panel border border-border bg-surface p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground">{template.title}</h3>
                      <StatusPill status={template.status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold capitalize text-muted-foreground">
                      {getRoadmapTemplateGoalLabel(template.goalKey)} · {template.level}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{template.description || 'No description added yet.'}</p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                      <span className="rounded-full bg-surface-secondary px-3 py-1.5">{modules.length} module{modules.length === 1 ? '' : 's'}</span>
                      <span className="rounded-full bg-surface-secondary px-3 py-1.5">{calculatedDurationDays} days</span>
                    </div>

                    {modules.length ? (
                      <div className="mt-4 rounded-surface border border-border bg-surface-secondary/35 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Module sequence</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {modules.slice(0, 5).map((module, index) => (
                            <span key={`${module.title}-${index}`} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground">
                              {index + 1}. {module.title}
                            </span>
                          ))}
                          {modules.length > 5 ? <span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">+{modules.length - 5} more</span> : null}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[340px] lg:justify-end">
                    {template.status !== 'archived' ? (
                      <Link to={`/admin/templates/${template._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs">
                        <Pencil size={14} aria-hidden="true" /> Edit
                      </Link>
                    ) : null}
                    {template.status === 'draft' ? (
                      <Button type="button" variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => openPublish(template)}>
                        <ClipboardCheck size={14} aria-hidden="true" /> Publish
                      </Button>
                    ) : null}
                    {template.status !== 'archived' ? (
                      <Button type="button" variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => openArchive(template)}>
                        <Archive size={14} aria-hidden="true" /> Archive
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button type="button" variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => openDelete(template)}>
                        <Trash2 size={14} aria-hidden="true" /> Delete
                      </Button>
                    ) : null}
                  </div>
                </div>

                {template.status === 'archived' ? (
                  <p className="mt-4 text-xs font-semibold text-amber-700">This archived template still reserves the {template.level} level. Delete it permanently before creating a replacement for the same learning path and level.</p>
                ) : null}
              </article>
            );
          }) : (
            <EmptyState title="No roadmap templates found" description="Create a template draft or adjust the current filters." />
          )}
        </div>

        <PaginationControls pagination={templatesQuery.data?.pagination} setFilters={setFilters} />
      </Card>

      <ConfirmDialog
        open={Boolean(publishTarget)}
        title="Publish roadmap template?"
        description={`Publish “${publishTarget?.title || ''}” for future learner roadmap generation. The server will verify module order, lesson availability, and Quiz-bank coverage first.`}
        confirmLabel="Publish template"
        tone="primary"
        isLoading={updateStatus.isPending}
        loadingLabel="Publishing..."
        onCancel={() => setPublishTarget(null)}
        onConfirm={() => updateStatus.mutate(
          { id: publishTarget._id, status: 'published', confirmPublish: true },
          { onSuccess: () => setPublishTarget(null) }
        )}
      >
        {updateStatus.error?.errors?.length ? (
          <ul className="space-y-1 text-sm text-rose-700">
            {updateStatus.error.errors.map((item, index) => <li key={`${item.field}-${index}`}>• {item.message}</li>)}
          </ul>
        ) : updateStatus.error?.message ? <ErrorMessage message={updateStatus.error.message} /> : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive roadmap template?"
        description={`Archive “${archiveTarget?.title || ''}”. It will stop being available for future roadmap generation, while already generated learner roadmaps remain unchanged.`}
        confirmLabel="Archive template"
        tone="primary"
        isLoading={updateStatus.isPending}
        loadingLabel="Archiving..."
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => updateStatus.mutate(
          { id: archiveTarget._id, status: 'archived' },
          { onSuccess: () => setArchiveTarget(null) }
        )}
      >
        {updateStatus.error?.message ? <ErrorMessage message={updateStatus.error.message} /> : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete roadmap template permanently?"
        description={`Delete “${deleteTarget?.title || ''}”. This cannot be undone.`}
        confirmLabel="Delete permanently"
        tone="danger"
        isLoading={deleteTemplate.isPending}
        loadingLabel="Deleting..."
        confirmDisabled={deleteConfirmation !== 'DELETE'}
        onCancel={closeDelete}
        onConfirm={() => deleteTemplate.mutate(deleteTarget._id, { onSuccess: closeDelete })}
      >
        <div className="space-y-4">
          <div className="rounded-surface border border-rose-200 bg-rose-50/70 p-4 text-sm leading-6 text-rose-700">
            <p className="font-bold text-rose-800">Existing learner roadmaps are preserved.</p>
            <p className="mt-1">Deleting this template removes only the reusable template used for future roadmap generation. It also frees this learning-path level so a new template can be created later.</p>
          </div>
          {deleteTemplate.error?.message ? <ErrorMessage message={deleteTemplate.error.message} /> : null}
          <Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" />
        </div>
      </ConfirmDialog>
    </PageShell>
  );
}
