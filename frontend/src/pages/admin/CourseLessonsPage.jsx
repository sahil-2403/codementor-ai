import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useAdminCourses, useAdminLessons, useDeleteLesson, useUpdateLessonStatus } from '../../queries/adminQueries.js';

export default function CourseLessonsPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: searchParams.get('course') || '' });
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const lessonsQuery = useAdminLessons(filters);
  const coursesQuery = useAdminCourses({ limit: 100 });
  const updateStatus = useUpdateLessonStatus();
  const deleteLesson = useDeleteLesson();
  if (lessonsQuery.isLoading || coursesQuery.isLoading) return <Loader label="Loading course lessons..." />;
  const lessons = lessonsQuery.data?.lessons || [];
  const courses = (coursesQuery.data?.courses || []).filter((course) => course.status !== 'archived');
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course curriculum" eyebrowIcon={BookOpen} title="Lessons" description="Lessons belong to one Course and one Topic. Templates reference these lesson records directly, so cross-course lesson selection is impossible." actions={<Link to={filters.course ? `/admin/lessons/new?course=${filters.course}` : '/admin/lessons/new'} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add lesson</Link>} />
    <ErrorMessage message={lessonsQuery.error?.message || coursesQuery.error?.message} />
    <Card className="shadow-sm"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Select label="Course" value={filters.course} onChange={(e) => update('course', e.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><Input label="Search" value={filters.search} onChange={(e) => update('search', e.target.value)} placeholder="Lesson title or tag" /><Select label="Difficulty" value={filters.difficulty} onChange={(e) => update('difficulty', e.target.value)}><option value="">All difficulties</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Select label="Status" value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div></Card>

    <div className="space-y-3">{lessons.length ? lessons.map((lesson) => {
      const archived = lesson.status === 'archived';
      return <Card key={lesson._id} className="min-w-0 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-lg font-bold text-foreground">{lesson.title}</h2><StatusPill status={lesson.status} /></div><p className="mt-1 text-xs font-semibold text-primary-strong">{lesson.course?.title || 'Unknown course'} · {lesson.topic?.title || 'Unknown topic'}</p><p className="mt-2 text-sm capitalize text-muted-foreground">{lesson.difficulty} · {lesson.estimatedMinutes || 0} min</p></div><div className="flex flex-wrap gap-2">{!archived ? <Link to={`/admin/lessons/${lesson._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => { updateStatus.reset(); setStatusTarget({ item: lesson, status: 'restored' }); }}>Restore</Button>}{lesson.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setStatusTarget({ item: lesson, status: 'published' })}>Publish</Button> : null}{!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { updateStatus.reset(); setStatusTarget({ item: lesson, status: 'archived' }); }}><Archive size={14} /> Archive</Button> : null}{archived ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { deleteLesson.reset(); setDeleteTarget(lesson); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}</div></div></Card>;
    }) : <EmptyState title="No lessons found" description="Choose a Course, add its first lesson, or adjust the filters." />}</div>

    <ConfirmDialog open={Boolean(statusTarget)} title={statusTarget?.status === 'published' ? 'Publish lesson?' : statusTarget?.status === 'restored' ? 'Restore lesson and dependents?' : 'Archive lesson and dependents?'} description={statusTarget?.status === 'published' ? 'The parent Course may be Draft or Published, but the Course and Topic must be available.' : statusTarget?.status === 'restored' ? 'Restore this Lesson and its linked Quiz questions and dependent Projects. If the Course or Topic is archived, restore that parent first.' : 'Archive this Lesson and its linked Quiz questions and dependent Projects. A published Roadmap Template using this Lesson will block the action and explain which template to handle first.'} confirmLabel={statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'restored' ? 'Restore all' : 'Archive all'} tone="primary" isLoading={updateStatus.isPending} onCancel={() => setStatusTarget(null)} onConfirm={() => updateStatus.mutate({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' }, { onSuccess: () => setStatusTarget(null) })}><LifecycleError error={updateStatus.error} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete archived lesson permanently?" description={`Permanently delete “${deleteTarget?.title || ''}” and its unused linked Quiz questions and dependent Projects. Roadmap Template references or learner history will block deletion.`} confirmLabel="Delete permanently" tone="danger" isLoading={deleteLesson.isPending} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }} onConfirm={() => deleteLesson.mutate(deleteTarget._id, { onSuccess: () => { setDeleteTarget(null); setDeleteConfirmation(''); } })}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} /><LifecycleError error={deleteLesson.error} /></ConfirmDialog>
  </PageShell>;
}
