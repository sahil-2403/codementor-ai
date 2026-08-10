import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Pencil, Plus, RotateCcw, Route, Trash2 } from 'lucide-react';
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
import { COURSE_CATEGORIES, labelFor } from '../../constants/catalog.js';
import { useAdminLearningPaths, useDeleteLearningPath, useUpdateLearningPathStatus } from '../../queries/adminQueries.js';

const initialFilters = { page: 1, limit: 50, search: '', status: '', category: '' };

export default function LearningPathsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const query = useAdminLearningPaths(filters);
  const updateStatus = useUpdateLearningPathStatus();
  const deletePath = useDeleteLearningPath();
  if (query.isLoading) return <Loader label="Loading learning paths..." />;
  const paths = query.data?.learningPaths || [];
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const actionLabel = statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'draft' ? 'Restore to Draft' : 'Archive';

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Learning catalog" eyebrowIcon={Route} title="Learning paths" description="Connect several published courses into larger goals without changing whether those courses can be learned independently." actions={<Link to="/admin/learning-paths/new" className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add learning path</Link>} />
    <ErrorMessage message={query.error?.message} />
    <Card className="shadow-sm"><div className="grid gap-3 md:grid-cols-3"><Input label="Search" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Java Full Stack..." /><Select label="Category" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">All categories</option>{COURSE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select label="Status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div></Card>

    <div className="space-y-4">
      {paths.length ? paths.map((path) => {
        const archived = path.status === 'archived';
        return <Card key={path._id} className="min-w-0 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-xl font-bold text-foreground">{path.title}</h2><StatusPill status={path.status} />{path.featured ? <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-strong">Featured</span> : null}</div><p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary-strong">{labelFor(COURSE_CATEGORIES, path.category)}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{path.description}</p></div>
            <div className="flex flex-wrap gap-2">
              {!archived ? <Link to={`/admin/learning-paths/${path._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : null}
              {path.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setStatusTarget({ item: path, status: 'published' })}>Publish</Button> : null}
              {!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { updateStatus.reset(); setStatusTarget({ item: path, status: 'archived' }); }}><Archive size={14} /> Archive</Button> : <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { updateStatus.reset(); setStatusTarget({ item: path, status: 'draft' }); }}><RotateCcw size={14} /> Restore</Button>}
              {archived ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { deletePath.reset(); setDeleteTarget(path); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}
            </div>
          </div>
          <div className="mt-5 rounded-panel border border-border bg-surface-secondary/35 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Course sequence</p><div className="mt-2 flex flex-wrap gap-2">{(path.courses || []).sort((a, b) => a.order - b.order).map((entry) => <span key={entry.course?._id || entry.order} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground">{entry.order}. {entry.course?.title || 'Course'}{entry.defaultLevel ? ` · ${entry.defaultLevel}` : ''}</span>)}</div></div>
          <div className="mt-4 flex flex-wrap gap-2">{(path.technologies || []).map((tech) => <span key={tech._id} className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">{tech.name}</span>)}</div>
        </Card>;
      }) : <EmptyState title="No learning paths found" description="Create a path or change the filters." />}
    </div>

    <ConfirmDialog
      open={Boolean(statusTarget)}
      title={`${actionLabel} learning path?`}
      description={statusTarget?.status === 'published'
        ? 'Every Course in the path must already be published and support its configured default level.'
        : statusTarget?.status === 'draft'
          ? 'Restore this Learning Path to Draft. Its Course sequence is preserved and the Courses themselves are not changed.'
          : 'Archive this Learning Path before permanent deletion. Courses inside the path are references and are never archived with it.'}
      confirmLabel={actionLabel}
      tone="primary"
      isLoading={updateStatus.isPending}
      onCancel={() => setStatusTarget(null)}
      onConfirm={() => updateStatus.mutate({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' }, { onSuccess: () => setStatusTarget(null) })}
    ><LifecycleError error={updateStatus.error} /></ConfirmDialog>
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      title="Delete archived learning path permanently?"
      description={`Permanently delete “${deleteTarget?.title || ''}”. Courses inside it are not deleted. Learner history may block permanent deletion.`}
      confirmLabel="Delete permanently"
      tone="danger"
      isLoading={deletePath.isPending}
      confirmDisabled={deleteConfirmation !== 'DELETE'}
      onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }}
      onConfirm={() => deletePath.mutate(deleteTarget._id, { onSuccess: () => { setDeleteTarget(null); setDeleteConfirmation(''); } })}
    ><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} /><LifecycleError error={deletePath.error} /></ConfirmDialog>
  </PageShell>;
}
