import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import LifecycleError from '../../components/admin/LifecycleError.jsx';
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

export default function CourseLessonsPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: searchParams.get('course') || '' });
  const [lessons, setLessons] = useState([]);
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
    Promise.all([adminApi.lessons(filters), adminApi.courses({ limit: 100 })])
      .then(([lessonResult, courseResult]) => {
        if (!active) return;
        setLessons(lessonResult?.lessons || []);
        setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
      })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters, loadAttempt]);

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const resetFilters = () => setFilters({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: '' });

  const changeStatus = async () => {
    if (!statusTarget) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.updateLessonStatus({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' });
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
      await adminApi.deleteLesson(deleteTarget._id);
      setDeleteTarget(null);
      setDeleteConfirmation('');
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <Loader label="Loading course lessons..." />;

  return (
    <PageShell className="space-y-5 pb-8">
      <PageHeader eyebrow="Course curriculum" eyebrowIcon={BookOpen} title="Lessons" description="Create and manage lessons inside each course topic." actions={<Link to={filters.course ? `/admin/lessons/new?course=${filters.course}` : '/admin/lessons/new'} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add lesson</Link>} />
      <ErrorMessage message={error?.message} />

      <div className="grid gap-3 rounded-surface border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-5">
        <Input label="Search" value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Lesson title" />
        <Select label="Course" value={filters.course} onChange={(event) => update('course', event.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>
        <Select label="Difficulty" value={filters.difficulty} onChange={(event) => update('difficulty', event.target.value)}><option value="">All difficulties</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
        <Select label="Status" value={filters.status} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select>
        <div className="flex items-end"><Button type="button" variant="secondary" className="w-full" onClick={resetFilters}>Reset</Button></div>
      </div>

      <div className="space-y-3">
        {lessons.length ? lessons.map((lesson) => {
          const archived = lesson.status === 'archived';
          return (
            <Card key={lesson._id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{lesson.title}</h2><StatusPill status={lesson.status} /><LevelBadge level={lesson.difficulty} /></div>
                  <p className="mt-1 text-xs font-semibold text-primary-strong">{lesson.course?.title || 'Unknown course'} · {lesson.topic?.title || 'Unknown topic'}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{lesson.estimatedMinutes || 0} min</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!archived ? <Link to={`/admin/lessons/${lesson._id}/edit`} className="ui-button ui-button--ghost min-h-9 px-3 text-xs"><Pencil size={14} /> Edit</Link> : <Button variant="secondary" onClick={() => setStatusTarget({ item: lesson, status: 'restored' })}>Restore</Button>}
                  {lesson.status === 'draft' ? <Button variant="secondary" onClick={() => setStatusTarget({ item: lesson, status: 'published' })}>Publish</Button> : null}
                  {!archived ? <Button variant="secondary" onClick={() => setStatusTarget({ item: lesson, status: 'archived' })}><Archive size={14} /> Archive</Button> : null}
                  {archived ? <Button variant="danger" onClick={() => { setDeleteTarget(lesson); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}
                </div>
              </div>
            </Card>
          );
        }) : <EmptyState title="No lessons found" description="Add a lesson or adjust the filters." />}
      </div>

      <ConfirmDialog open={Boolean(statusTarget)} title={statusTarget?.status === 'published' ? 'Publish lesson?' : statusTarget?.status === 'restored' ? 'Restore lesson and dependents?' : 'Archive lesson and dependents?'} confirmLabel={statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'restored' ? 'Restore all' : 'Archive all'} isLoading={actionLoading} onCancel={() => setStatusTarget(null)} onConfirm={changeStatus}><LifecycleError error={actionError} /></ConfirmDialog>
      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete archived lesson permanently?" confirmLabel="Delete permanently" tone="danger" isLoading={actionLoading} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }} onConfirm={deleteItem}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /><LifecycleError error={actionError} /></ConfirmDialog>
    </PageShell>
  );
}
