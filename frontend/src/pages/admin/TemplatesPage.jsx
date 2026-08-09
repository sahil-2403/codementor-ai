import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { useAdminCourses, useAdminTemplates, useDeleteTemplate, useUpdateTemplateStatus } from '../../queries/adminQueries.js';

export default function TemplatesPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 8, search: '', status: '', level: '', course: searchParams.get('course') || '' });
  const [publishTarget, setPublishTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const templatesQuery = useAdminTemplates(filters);
  const coursesQuery = useAdminCourses({ limit: 100 });
  const updateStatus = useUpdateTemplateStatus();
  const deleteTemplate = useDeleteTemplate();

  if (templatesQuery.isLoading || coursesQuery.isLoading) return <Loader label="Loading roadmap templates..." />;
  const templates = templatesQuery.data?.templates || [];
  const courses = (coursesQuery.data?.courses || []).filter((course) => course.status !== 'archived');
  const update = (key, value) => setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
  const derivedDays = (template) => (template.modules || []).reduce((sum, module) => sum + (Number(module.durationDays) || 0), 0);
  const closeDelete = () => { setDeleteTarget(null); setDeleteConfirmation(''); };

  return <PageShell className="space-y-5 pb-6">
    <PageHeader
      variant="compact"
      eyebrow="Course curriculum"
      eyebrowIcon={Map}
      title="Roadmap templates"
      description="Manage the Beginner, Intermediate, and Advanced roadmap structure for each Course. Templates never mix lessons or quiz coverage across courses."
      actions={<Link to={filters.course ? `/admin/templates/new?course=${filters.course}` : '/admin/templates/new'} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Create template</Link>}
    />
    <ErrorMessage message={templatesQuery.error?.message || coursesQuery.error?.message} />

    <Card className="shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Template library</p><h2 className="mt-1 text-xl font-bold text-foreground">Course-level roadmaps</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{templatesQuery.data?.pagination?.total || 0} template(s) match the current filters.</p></div><p className="max-w-lg text-sm leading-6 text-muted-foreground">Published templates power future roadmap generation. A course can have at most one template for each enabled learner level.</p></div>
      <div className="mt-5 grid gap-3 rounded-panel border border-border bg-surface-secondary/45 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_0.8fr_0.8fr_auto]">
        <Input label="Search" placeholder="Template title or description" value={filters.search} onChange={(e) => update('search', e.target.value)} />
        <Select label="Course" value={filters.course} onChange={(e) => update('course', e.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>
        <Select label="Level" value={filters.level} onChange={(e) => update('level', e.target.value)}><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
        <Select label="Status" value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select>
        <div className="flex items-end"><Button type="button" variant="secondary" className="w-full xl:w-auto" onClick={() => setFilters({ page: 1, limit: 8, search: '', status: '', level: '', course: '' })}>Reset</Button></div>
      </div>

      <div className="mt-4 space-y-3">{templates.length ? templates.map((template) => {
        const modules = template.modules || [];
        const course = template.course;
        const canDelete = template.status !== 'published';
        return <article key={template._id} className="rounded-panel border border-border bg-surface p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-lg font-bold text-foreground">{template.title}</h3><StatusPill status={template.status} /></div><p className="mt-1 text-sm font-semibold capitalize text-muted-foreground">{course?.title || 'Unknown course'} · {template.level}</p><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{template.description || 'No description added yet.'}</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground"><span className="rounded-full bg-surface-secondary px-3 py-1.5">{modules.length} module{modules.length === 1 ? '' : 's'}</span><span className="rounded-full bg-surface-secondary px-3 py-1.5">{derivedDays(template)} days</span></div>{modules.length ? <div className="mt-4 rounded-surface border border-border bg-surface-secondary/35 p-3"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Module sequence</p><div className="mt-2 flex flex-wrap gap-2">{modules.slice(0, 5).map((module, index) => <span key={`${module.title}-${index}`} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground">{index + 1}. {module.title}</span>)}{modules.length > 5 ? <span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">+{modules.length - 5} more</span> : null}</div></div> : null}</div>
            <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[340px] lg:justify-end">{template.status !== 'archived' ? <Link to={`/admin/templates/${template._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : null}{template.status === 'draft' ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { updateStatus.reset(); setPublishTarget(template); }}><ClipboardCheck size={14} /> Publish</Button> : null}{template.status !== 'archived' ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { updateStatus.reset(); setArchiveTarget(template); }}><Archive size={14} /> Archive</Button> : null}{canDelete ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { deleteTemplate.reset(); setDeleteConfirmation(''); setDeleteTarget(template); }}><Trash2 size={14} /> Delete</Button> : null}</div>
          </div>
          {template.status === 'archived' ? <p className="mt-4 text-xs font-semibold text-warning">This archived template still reserves the {template.level} level for {course?.title || 'this course'}. Delete it permanently before creating a replacement.</p> : null}
        </article>;
      }) : <EmptyState title="No roadmap templates found" description="Choose a Course, create a template draft, or adjust the filters." />}</div>
      <PaginationControls pagination={templatesQuery.data?.pagination} setFilters={setFilters} />
    </Card>

    <ConfirmDialog open={Boolean(publishTarget)} title="Publish roadmap template?" description={`Publish “${publishTarget?.title || ''}” for future learner roadmap generation. The server verifies Course ownership, published lessons, and Quiz-bank coverage first.`} confirmLabel="Publish template" tone="primary" isLoading={updateStatus.isPending} loadingLabel="Publishing..." onCancel={() => setPublishTarget(null)} onConfirm={() => updateStatus.mutate({ id: publishTarget._id, status: 'published', confirmPublish: true }, { onSuccess: () => setPublishTarget(null) })}>{updateStatus.error?.errors?.length ? <ul className="space-y-1 text-sm text-error">{updateStatus.error.errors.map((item, index) => <li key={`${item.field}-${index}`}>• {item.message}</li>)}</ul> : <ErrorMessage message={updateStatus.error?.message} />}</ConfirmDialog>
    <ConfirmDialog open={Boolean(archiveTarget)} title="Archive roadmap template?" description={`Archive “${archiveTarget?.title || ''}”. It will stop being available for future roadmap generation while already generated CoursePlans remain unchanged.`} confirmLabel="Archive template" tone="primary" isLoading={updateStatus.isPending} loadingLabel="Archiving..." onCancel={() => setArchiveTarget(null)} onConfirm={() => updateStatus.mutate({ id: archiveTarget._id, status: 'archived' }, { onSuccess: () => setArchiveTarget(null) })}><ErrorMessage message={updateStatus.error?.message} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete roadmap template permanently?" description={`Delete “${deleteTarget?.title || ''}”. This cannot be undone.`} confirmLabel="Delete permanently" tone="danger" isLoading={deleteTemplate.isPending} loadingLabel="Deleting..." confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={closeDelete} onConfirm={() => deleteTemplate.mutate(deleteTarget._id, { onSuccess: closeDelete })}><div className="space-y-4"><div className="rounded-surface border border-error/20 bg-error-soft p-4 text-sm leading-6 text-error"><p className="font-bold">Existing generated roadmaps are preserved.</p><p className="mt-1">Deleting this template removes only the reusable curriculum for future generation and frees the Course + Level combination.</p></div><ErrorMessage message={deleteTemplate.error?.message} /><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} autoComplete="off" /></div></ConfirmDialog>
  </PageShell>;
}
