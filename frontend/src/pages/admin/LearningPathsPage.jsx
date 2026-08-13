import { useEffect, useState } from 'react';
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
import { adminApi } from '../../api/adminApi.js';

const initialFilters = { page: 1, limit: 50, search: '', status: '', category: '' };

export default function LearningPathsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [paths, setPaths] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [statusTarget, setStatusTarget] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true); setError(null);
    adminApi.learningPaths(filters)
      .then((result) => { if (active) setPaths(result?.learningPaths || []); })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters, loadAttempt]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const actionLabel = statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'draft' ? 'Restore to Draft' : 'Archive';
  const changeStatus = async () => {
    if (!statusTarget) return;
    setActionLoading(true); setActionError(null);
    try { await adminApi.updateLearningPathStatus({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' }); setStatusTarget(null); setLoadAttempt((value) => value + 1); }
    catch (requestError) { setActionError(requestError); }
    finally { setActionLoading(false); }
  };
  const deleteItem = async () => {
    if (!deleteTarget) return;
    setActionLoading(true); setActionError(null);
    try { await adminApi.deleteLearningPath(deleteTarget._id); setDeleteTarget(null); setDeleteConfirmation(''); setLoadAttempt((value) => value + 1); }
    catch (requestError) { setActionError(requestError); }
    finally { setActionLoading(false); }
  };

  if (isLoading) return <Loader label="Loading learning paths..." />;
  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Learning catalog" eyebrowIcon={Route} title="Learning paths" description="Connect several published courses into larger goals without changing whether those courses can be learned independently." actions={<Link to="/admin/learning-paths/new" className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add learning path</Link>} />
    <ErrorMessage message={error?.message} />
    <Card><div className="grid gap-3 md:grid-cols-3"><Input label="Search" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} /><Select label="Category" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">All categories</option>{COURSE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select label="Status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div></Card>
    <div className="space-y-4">{paths.length ? paths.map((path) => { const archived = path.status === 'archived'; return <Card key={path._id}><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{path.title}</h2><StatusPill status={path.status} />{path.featured ? <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-strong">Featured</span> : null}</div><p className="mt-1 text-xs font-bold uppercase text-primary-strong">{labelFor(COURSE_CATEGORIES, path.category)}</p><p className="mt-3 text-sm text-muted-foreground">{path.description}</p></div><div className="flex flex-wrap gap-2">{!archived ? <Link to={`/admin/learning-paths/${path._id}/edit`} className="ui-button ui-button--ghost min-h-9 px-3 text-xs"><Pencil size={14} /> Edit</Link> : null}{path.status === 'draft' ? <Button variant="secondary" onClick={() => { setActionError(null); setStatusTarget({ item: path, status: 'published' }); }}>Publish</Button> : null}{!archived ? <Button variant="secondary" onClick={() => { setActionError(null); setStatusTarget({ item: path, status: 'archived' }); }}><Archive size={14} /> Archive</Button> : <Button variant="secondary" onClick={() => { setActionError(null); setStatusTarget({ item: path, status: 'draft' }); }}><RotateCcw size={14} /> Restore</Button>}{archived ? <Button variant="danger" onClick={() => { setActionError(null); setDeleteTarget(path); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}</div></div><div className="mt-5 rounded-panel border border-border bg-surface-secondary/35 p-4"><div className="flex flex-wrap gap-2">{(path.courses || []).sort((a, b) => a.order - b.order).map((entry) => <span key={entry.course?._id || entry.order} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold">{entry.order}. {entry.course?.title || 'Course'}{entry.defaultLevel ? ` · ${entry.defaultLevel}` : ''}</span>)}</div></div></Card>; }) : <EmptyState title="No learning paths found" description="Create a path or change the filters." />}</div>
    <ConfirmDialog open={Boolean(statusTarget)} title={`${actionLabel} learning path?`} confirmLabel={actionLabel} isLoading={actionLoading} onCancel={() => setStatusTarget(null)} onConfirm={changeStatus}><LifecycleError error={actionError} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete archived learning path permanently?" confirmLabel="Delete permanently" tone="danger" isLoading={actionLoading} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }} onConfirm={deleteItem}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} /><LifecycleError error={actionError} /></ConfirmDialog>
  </PageShell>;
}
