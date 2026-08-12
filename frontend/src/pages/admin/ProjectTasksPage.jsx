import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, FolderCode, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
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

export default function ProjectTasksPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: searchParams.get('course') || '' });
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    Promise.all([adminApi.listProjectTasks(filters), adminApi.listCourses({ limit: 100 })])
      .then(([taskResult, courseResult]) => {
        if (!active) return;
        setTasks(taskResult?.projectTasks || []);
        setCourses(courseResult?.courses || []);
      })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters, loadAttempt]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const actionLabel = statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'restored' ? 'Restore to Draft' : 'Archive';

  const changeStatus = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      await adminApi.changeProjectTaskStatus(statusTarget.item._id, { status: statusTarget.status, confirmPublish: statusTarget.status === 'published' });
      setStatusTarget(null);
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setStatusError(requestError);
    } finally {
      setStatusLoading(false);
    }
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await adminApi.deleteProjectTask(deleteTarget._id);
      setDeleteTarget(null);
      setDeleteConfirmation('');
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setDeleteError(requestError);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading) return <Loader label="Loading project tasks..." />;

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course curriculum" eyebrowIcon={FolderCode} title="Project tasks" description="Manage practical coding tasks owned by one Course and linked to its published Lessons." actions={<Link to={`/admin/projects/new${filters.course ? `?course=${filters.course}` : ''}`} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add project task</Link>} />
    <ErrorMessage message={error?.message} />
    <Card className="shadow-sm"><div className="grid gap-3 md:grid-cols-4"><Input label="Search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} /><Select label="Course" value={filters.course} onChange={(event) => updateFilter('course', event.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><Select label="Difficulty" value={filters.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Select label="Status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div></Card>
    <div className="grid gap-4 md:grid-cols-2">
      {tasks.length ? tasks.map((task) => {
        const archived = task.status === 'archived';
        return <Card key={task._id} className="shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-foreground">{task.title}</h2><StatusPill status={task.status} /></div><p className="mt-1 text-xs font-semibold text-primary-strong">{task.course?.title || 'Course'}{task.moduleTitle ? ` · ${task.moduleTitle}` : ''}</p></div><span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">{task.difficulty || 'beginner'}</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{task.description}</p><p className="mt-3 text-xs font-semibold text-muted-foreground">{task.estimatedMinutes || 0} min · {(task.relatedLessons || []).length} related lessons</p><div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">{!archived ? <Link to={`/admin/projects/${task._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : null}{task.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => { setStatusError(null); setStatusTarget({ item: task, status: 'published' }); }}>Publish</Button> : null}{!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setStatusError(null); setStatusTarget({ item: task, status: 'archived' }); }}><Archive size={14} /> Archive</Button> : <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setStatusError(null); setStatusTarget({ item: task, status: 'restored' }); }}><RotateCcw size={14} /> Restore</Button>}{archived ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setDeleteError(null); setDeleteTarget(task); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}</div></Card>;
      }) : <div className="md:col-span-2"><EmptyState title="No project tasks found" description="Create a Project Task or change the filters." /></div>}
    </div>
    <ConfirmDialog open={Boolean(statusTarget)} title={`${actionLabel} project task?`} description={statusTarget?.status === 'published' ? 'Publishing requires an available Course and valid related Lessons.' : statusTarget?.status === 'restored' ? 'Restore this Project Task to Draft so it can be reviewed and published again.' : 'Archive this Project Task. Existing learner submissions remain available.'} confirmLabel={actionLabel} tone="primary" isLoading={statusLoading} onCancel={() => setStatusTarget(null)} onConfirm={changeStatus}><LifecycleError error={statusError} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete archived project task permanently?" description="Learner submissions can block permanent deletion so project history stays valid." confirmLabel="Delete permanently" tone="danger" isLoading={deleteLoading} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }} onConfirm={deleteItem}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /><LifecycleError error={deleteError} /></ConfirmDialog>
  </PageShell>;
}
