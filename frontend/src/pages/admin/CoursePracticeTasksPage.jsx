import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, Dumbbell, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import AdminFilterPanel from '../../components/admin/AdminFilterPanel.jsx';
import LifecycleError from '../../components/admin/LifecycleError.jsx';
import PermanentDeleteDialog from '../../components/admin/PermanentDeleteDialog.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import LevelBadge from '../../components/common/LevelBadge.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { adminApi } from '../../api/adminApi.js';
import { adminPracticeApi } from '../../api/adminPracticeApi.js';

export default function CoursePracticeTasksPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: searchParams.get('course') || '' });
  const [practiceTasks, setPracticeTasks] = useState([]);
  const [courses, setCourses] = useState([]);
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
    setError(null);
    Promise.all([adminPracticeApi.list(filters), adminApi.courses({ limit: 100 })])
      .then(([practiceResult, courseResult]) => {
        if (!active) return;
        setPracticeTasks(practiceResult?.practiceTasks || []);
        setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
      })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters, loadAttempt]);

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const resetFilters = () => setFilters({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: '' });
  const actionLabel = statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'draft' ? 'Restore to Draft' : 'Archive';

  const changeStatus = async () => {
    if (!statusTarget) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminPracticeApi.updateStatus({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' });
      setStatusTarget(null);
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
      await adminPracticeApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      setDeleteConfirmation('');
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setActionLoading(false);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteConfirmation('');
    setActionError(null);
  };

  if (isLoading) return <Loader label="Loading practice tasks..." />;

  return (
    <PageShell className="space-y-5 pb-8">
      <PageHeader eyebrow="Course practice" eyebrowIcon={Dumbbell} title="Practice tasks" description="Create and manage focused coding tasks for each course." actions={<Link to={filters.course ? `/admin/practice-tasks/new?course=${filters.course}` : '/admin/practice-tasks/new'} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add practice task</Link>} />
      <ErrorMessage message={error?.message} />

      <AdminFilterPanel>
        <Input label="Search" value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Practice title or module" />
        <Select label="Course" value={filters.course} onChange={(event) => update('course', event.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>
        <Select label="Difficulty" value={filters.difficulty} onChange={(event) => update('difficulty', event.target.value)}><option value="">All difficulties</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
        <Select label="Status" value={filters.status} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select>
        <div className="flex items-end"><Button type="button" variant="secondary" className="w-full" onClick={resetFilters}>Reset</Button></div>
      </AdminFilterPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        {practiceTasks.length ? practiceTasks.map((practiceTask) => {
          const archived = practiceTask.status === 'archived';
          return (
            <Card key={practiceTask._id} className="min-w-0 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-lg font-bold text-foreground">{practiceTask.title}</h2><StatusPill status={practiceTask.status} /></div>
                  <p className="mt-1 text-xs font-semibold text-primary-strong">{practiceTask.course?.title || 'Unknown course'}</p>
                </div>
                <LevelBadge level={practiceTask.difficulty} />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{practiceTask.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground"><span>{practiceTask.estimatedMinutes || 0} min</span>{practiceTask.moduleTitle ? <span>• {practiceTask.moduleTitle}</span> : null}<span>• {(practiceTask.relatedLessons || []).length} related lesson(s)</span></div>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                {!archived ? <Link to={`/admin/practice-tasks/${practiceTask._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : null}
                {practiceTask.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setStatusTarget({ item: practiceTask, status: 'published' })}>Publish</Button> : null}
                {!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => setStatusTarget({ item: practiceTask, status: 'archived' })}><Archive size={14} /> Archive</Button> : <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => setStatusTarget({ item: practiceTask, status: 'draft' })}><RotateCcw size={14} /> Restore</Button>}
                {archived ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setDeleteTarget(practiceTask); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}
              </div>
            </Card>
          );
        }) : <div className="lg:col-span-2"><EmptyState title="No practice tasks found" description="Create a practice task or adjust the filters." /></div>}
      </div>

      <ConfirmDialog open={Boolean(statusTarget)} title={`${actionLabel} practice task?`} description={statusTarget?.status === 'published' ? 'Publishing requires published related lessons, at least one requirement, and an expected output.' : statusTarget?.status === 'draft' ? 'Restore this practice task to Draft. If the parent course is archived, restore the course first.' : 'Archive this practice task before permanent deletion.'} confirmLabel={actionLabel} tone="primary" isLoading={actionLoading} onCancel={() => setStatusTarget(null)} onConfirm={changeStatus}><LifecycleError error={actionError} /></ConfirmDialog>
      <PermanentDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete archived practice task permanently?"
        description="Learner attempts will block deletion. If that happens, keep the task archived."
        confirmation={deleteConfirmation}
        onConfirmationChange={setDeleteConfirmation}
        onCancel={closeDeleteDialog}
        onConfirm={deleteItem}
        isLoading={actionLoading}
        error={actionError}
      />
    </PageShell>
  );
}
