import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, ClipboardCheck, Map, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import LifecycleError from '../../components/admin/LifecycleError.jsx';
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
import { adminApi } from '../../api/adminApi.js';

export default function TemplatesPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 8, search: '', status: '', level: '', course: searchParams.get('course') || '' });
  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [publishTarget, setPublishTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    Promise.all([adminApi.templates(filters), adminApi.courses({ limit: 100 })])
      .then(([templateResult, courseResult]) => {
        if (!active) return;
        setTemplates(templateResult?.templates || []);
        setPagination(templateResult?.pagination || null);
        setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
      })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters, loadAttempt]);

  const update = (key, value) => setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
  const derivedDays = (template) => (template.modules || []).reduce((sum, module) => sum + (Number(module.durationDays) || 0), 0);
  const closeDelete = () => { setDeleteTarget(null); setDeleteConfirmation(''); };
  const changeStatus = async (item, status) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.updateTemplateStatus({ id: item._id, status, confirmPublish: status === 'published' });
      setPublishTarget(null);
      setArchiveTarget(null);
      setRestoreTarget(null);
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setActionLoading(false);
    }
  };
  const deleteItem = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.deleteTemplate(deleteTarget._id);
      closeDelete();
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <Loader label="Loading roadmap templates..." />;

  return <PageShell className="space-y-5 pb-6">
    <PageHeader variant="compact" eyebrow="Course curriculum" eyebrowIcon={Map} title="Roadmap templates" description="Manage the Beginner, Intermediate, and Advanced roadmap structure for each Course." actions={<Link to={filters.course ? `/admin/templates/new?course=${filters.course}` : '/admin/templates/new'} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Create template</Link>} />
    <ErrorMessage message={error?.message} />
    <Card className="shadow-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Template library</p><h2 className="mt-1 text-xl font-bold text-foreground">Course-level roadmaps</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{pagination?.total || 0} template(s) match the current filters.</p></div></div><div className="mt-5 grid gap-3 rounded-panel border border-border bg-surface-secondary/45 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_0.8fr_0.8fr_auto]"><Input label="Search" value={filters.search} onChange={(e) => update('search', e.target.value)} /><Select label="Course" value={filters.course} onChange={(e) => update('course', e.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><Select label="Level" value={filters.level} onChange={(e) => update('level', e.target.value)}><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Select label="Status" value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select><div className="flex items-end"><Button type="button" variant="secondary" onClick={() => setFilters({ page: 1, limit: 8, search: '', status: '', level: '', course: '' })}>Reset</Button></div></div>
      <div className="mt-4 space-y-3">{templates.length ? templates.map((template) => { const modules = template.modules || []; const archived = template.status === 'archived'; return <article key={template._id} className="rounded-panel border border-border bg-surface p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{template.title}</h3><StatusPill status={template.status} /></div><p className="mt-1 text-sm font-semibold capitalize text-muted-foreground">{template.course?.title || 'Unknown course'} · {template.level}</p><p className="mt-3 text-sm text-muted-foreground">{template.description || 'No description added yet.'}</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground"><span className="rounded-full bg-surface-secondary px-3 py-1.5">{modules.length} modules</span><span className="rounded-full bg-surface-secondary px-3 py-1.5">{derivedDays(template)} days</span></div></div><div className="flex shrink-0 flex-wrap gap-2">{!archived ? <Link to={`/admin/templates/${template._id}/edit`} className="ui-button ui-button--ghost min-h-9 px-3 text-xs"><Pencil size={14} /> Edit</Link> : null}{template.status === 'draft' ? <Button variant="secondary" onClick={() => { setActionError(null); setPublishTarget(template); }}><ClipboardCheck size={14} /> Publish</Button> : null}{!archived ? <Button variant="secondary" onClick={() => { setActionError(null); setArchiveTarget(template); }}><Archive size={14} /> Archive</Button> : <Button variant="secondary" onClick={() => { setActionError(null); setRestoreTarget(template); }}><RotateCcw size={14} /> Restore</Button>}{archived ? <Button variant="danger" onClick={() => { setActionError(null); setDeleteConfirmation(''); setDeleteTarget(template); }}><Trash2 size={14} /> Delete</Button> : null}</div></div></article>; }) : <EmptyState title="No roadmap templates found" description="Choose a Course, create a template draft, or adjust the filters." />}</div>
      <PaginationControls pagination={pagination} setFilters={setFilters} />
    </Card>
    <ConfirmDialog open={Boolean(publishTarget)} title="Publish roadmap template?" confirmLabel="Publish template" isLoading={actionLoading} onCancel={() => setPublishTarget(null)} onConfirm={() => changeStatus(publishTarget, 'published')}><LifecycleError error={actionError} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(archiveTarget)} title="Archive roadmap template?" confirmLabel="Archive template" isLoading={actionLoading} onCancel={() => setArchiveTarget(null)} onConfirm={() => changeStatus(archiveTarget, 'archived')}><LifecycleError error={actionError} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(restoreTarget)} title="Restore roadmap template to Draft?" confirmLabel="Restore to Draft" isLoading={actionLoading} onCancel={() => setRestoreTarget(null)} onConfirm={() => changeStatus(restoreTarget, 'draft')}><LifecycleError error={actionError} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete archived roadmap template permanently?" confirmLabel="Delete permanently" tone="danger" isLoading={actionLoading} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={closeDelete} onConfirm={deleteItem}><div className="space-y-4"><LifecycleError error={actionError} /><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} /></div></ConfirmDialog>
  </PageShell>;
}
