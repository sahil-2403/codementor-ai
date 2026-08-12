import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, BookOpen, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
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

export default function LessonsAdminPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: searchParams.get('course') || '', topic: '' });
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
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
    Promise.all([
      adminApi.listLessons(filters),
      adminApi.listCourses({ limit: 100 }),
      adminApi.listTopics({ limit: 100, ...(filters.course ? { course: filters.course } : {}) })
    ])
      .then(([lessonResult, courseResult, topicResult]) => {
        if (!active) return;
        setLessons(lessonResult?.lessons || []);
        setCourses(courseResult?.courses || []);
        setTopics(topicResult?.topics || []);
      })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters, loadAttempt]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, ...(key === 'course' ? { topic: '' } : {}), page: 1 }));
  const actionLabel = statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'restored' ? 'Restore to Draft' : 'Archive';

  const changeStatus = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      await adminApi.changeLessonStatus(statusTarget.item._id, { status: statusTarget.status, confirmPublish: statusTarget.status === 'published' });
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
      await adminApi.deleteLesson(deleteTarget._id);
      setDeleteTarget(null);
      setDeleteConfirmation('');
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setDeleteError(requestError);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading) return <Loader label="Loading lessons..." />;

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course curriculum" eyebrowIcon={BookOpen} title="Lessons" description="Create and publish lessons inside Course Topics. Published lessons can be referenced by roadmap templates." actions={<Link to={`/admin/lessons/new${filters.course ? `?course=${filters.course}` : ''}`} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add lesson</Link>} />
    <ErrorMessage message={error?.message} />
    <Card className="shadow-sm"><div className="grid gap-3 md:grid-cols-5"><Input label="Search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} /><Select label="Course" value={filters.course} onChange={(event) => updateFilter('course', event.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><Select label="Topic" value={filters.topic} onChange={(event) => updateFilter('topic', event.target.value)}><option value="">All topics</option>{topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</Select><Select label="Difficulty" value={filters.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Select label="Status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div></Card>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {lessons.length ? lessons.map((lesson) => {
        const archived = lesson.status === 'archived';
        return <Card key={lesson._id} className="shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-foreground">{lesson.title}</h2><StatusPill status={lesson.status} /></div><p className="mt-1 text-xs font-semibold text-primary-strong">{lesson.course?.title || 'Course'} · {lesson.topic?.title || 'Topic'}</p></div><span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">{lesson.difficulty || 'beginner'}</span></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{lesson.summary || lesson.theory || 'No lesson summary yet.'}</p><div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">{!archived ? <Link to={`/admin/lessons/${lesson._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : null}{lesson.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => { setStatusError(null); setStatusTarget({ item: lesson, status: 'published' }); }}>Publish</Button> : null}{!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setStatusError(null); setStatusTarget({ item: lesson, status: 'archived' }); }}><Archive size={14} /> Archive</Button> : <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setStatusError(null); setStatusTarget({ item: lesson, status: 'restored' }); }}><RotateCcw size={14} /> Restore</Button>}{archived ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setDeleteError(null); setDeleteTarget(lesson); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}</div></Card>;
      }) : <div className="md:col-span-2 xl:col-span-3"><EmptyState title="No lessons found" description="Create a Lesson or change the filters." /></div>}
    </div>
    <ConfirmDialog open={Boolean(statusTarget)} title={`${actionLabel} lesson?`} description={statusTarget?.status === 'published' ? 'Publishing requires a valid Course, active Topic, complete lesson content, and any linked publishing requirements.' : statusTarget?.status === 'restored' ? 'Restore this Lesson to Draft. Owned Quiz Questions and Project Tasks return to Draft.' : 'Archive this Lesson and its owned Quiz Questions and Project Tasks. Published templates that reference it may block the action.'} confirmLabel={actionLabel} tone="primary" isLoading={statusLoading} onCancel={() => setStatusTarget(null)} onConfirm={changeStatus}><LifecycleError error={statusError} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete archived lesson permanently?" description={`Permanently delete “${deleteTarget?.title || ''}” and unused owned content. Learner history and Roadmap Template references may block deletion.`} confirmLabel="Delete permanently" tone="danger" isLoading={deleteLoading} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }} onConfirm={deleteItem}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /><LifecycleError error={deleteError} /></ConfirmDialog>
  </PageShell>;
}
