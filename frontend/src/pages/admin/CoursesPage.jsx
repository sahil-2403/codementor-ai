import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, BookOpenCheck, GraduationCap, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
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

export default function CoursesPage() {
  const [filters, setFilters] = useState(initialFilters);
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
    setError(null);
    adminApi.courses(filters)
      .then((result) => { if (active) setCourses(result?.courses || []); })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters, loadAttempt]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const actionLabel = statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'draft' ? 'Restore to Draft' : 'Archive';

  const changeStatus = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      await adminApi.updateCourseStatus({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' });
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
      await adminApi.deleteCourse(deleteTarget._id);
      setDeleteTarget(null);
      setDeleteConfirmation('');
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setDeleteError(requestError);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading) return <Loader label="Loading courses..." />;

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Learning catalog" eyebrowIcon={GraduationCap} title="Courses" description="Courses are the primary learning units. Learners can start any published course directly, regardless of how its technologies are grouped." actions={<Link to="/admin/courses/new" className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add course</Link>} />
    <ErrorMessage message={error?.message} />
    <Card className="shadow-sm"><div className="grid gap-3 md:grid-cols-3"><Input label="Search" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="React, Java Full Stack..." /><Select label="Category" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">All categories</option>{COURSE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select label="Status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div></Card>
    <div className="grid gap-4 lg:grid-cols-2">{courses.length ? courses.map((course) => {
      const archived = course.status === 'archived';
      return <Card key={course._id} className="min-w-0 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-xl font-bold text-foreground">{course.title}</h2><StatusPill status={course.status} /></div><p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary-strong">{labelFor(COURSE_CATEGORIES, course.category)}</p></div>{course.featured ? <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-strong">Featured</span> : null}</div><p className="mt-3 text-sm leading-6 text-muted-foreground">{course.description}</p><div className="mt-4 flex flex-wrap gap-2">{(course.technologies || []).map((tech) => <span key={tech._id} className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">{tech.name}</span>)}</div><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground"><span>{(course.availableLevels || []).map((level) => level[0].toUpperCase() + level.slice(1)).join(' · ')}</span>{course.primaryTechnology ? <span>• Primary: {course.primaryTechnology.name}</span> : null}</div><div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">{!archived ? <Link to={`/admin/courses/${course._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : null}{!archived ? <Link to={`/admin/courses/${course._id}/workspace`} className="ui-button ui-button--secondary min-h-9 gap-1.5 px-3 text-xs"><BookOpenCheck size={14} /> Workspace</Link> : null}{course.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => { setStatusError(null); setStatusTarget({ item: course, status: 'published' }); }}>Publish</Button> : null}{!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setStatusError(null); setStatusTarget({ item: course, status: 'archived' }); }}><Archive size={14} /> Archive</Button> : <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setStatusError(null); setStatusTarget({ item: course, status: 'draft' }); }}><RotateCcw size={14} /> Restore</Button>}{archived ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setDeleteError(null); setDeleteTarget(course); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}</div></Card>;
    }) : <div className="lg:col-span-2"><EmptyState title="No courses found" description="Create the first course or change the filters." /></div>}</div>
    <ConfirmDialog open={Boolean(statusTarget)} title={`${actionLabel} course?`} description={statusTarget?.status === 'published' ? 'Publishing is the final learner-catalog gate. Published technologies and a published roadmap template for every enabled level are required.' : statusTarget?.status === 'draft' ? 'Restore this Course to Draft. Its Topics become Active and its Lessons, Questions, Practice Tasks, and Roadmap Templates become Draft. Review and publish the content you want learners to use.' : 'Archive this Course directly. You do not need to archive its child curriculum first. Topics, Lessons, Quiz/Skill Check questions, Interview Questions, Practice Tasks, and Roadmap Templates are archived automatically. Learning Paths and prerequisite references are not changed and may block the archive.'} confirmLabel={actionLabel} tone="primary" isLoading={statusLoading} onCancel={() => setStatusTarget(null)} onConfirm={changeStatus}><LifecycleError error={statusError} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete archived course permanently?" description={`Permanently delete “${deleteTarget?.title || ''}” and all of its owned curriculum. Learning Path/prerequisite references or learner history will block deletion. This cannot be undone.`} confirmLabel="Delete permanently" tone="danger" isLoading={deleteLoading} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }} onConfirm={deleteItem}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} /><LifecycleError error={deleteError} /></ConfirmDialog>
  </PageShell>;
}
