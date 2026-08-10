import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, BookOpenCheck, GraduationCap, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
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
import { useAdminCourses, useDeleteCourse, useUpdateCourseStatus } from '../../queries/adminQueries.js';

const initialFilters = { page: 1, limit: 50, search: '', status: '', category: '' };

export default function CoursesPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const query = useAdminCourses(filters);
  const updateStatus = useUpdateCourseStatus();
  const deleteCourse = useDeleteCourse();
  if (query.isLoading) return <Loader label="Loading courses..." />;
  const courses = query.data?.courses || [];
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const actionLabel = statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'draft' ? 'Restore to Draft' : 'Archive';

  return <PageShell className="space-y-5 pb-8">
    <PageHeader
      eyebrow="Learning catalog"
      eyebrowIcon={GraduationCap}
      title="Courses"
      description="Courses are the primary learning units. Learners can start any published course directly, regardless of how its technologies are grouped."
      actions={<Link to="/admin/courses/new" className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add course</Link>}
    />
    <ErrorMessage message={query.error?.message} />
    <Card className="shadow-sm"><div className="grid gap-3 md:grid-cols-3">
      <Input label="Search" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="React, Java Full Stack..." />
      <Select label="Category" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">All categories</option>{COURSE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <Select label="Status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select>
    </div></Card>

    <div className="grid gap-4 lg:grid-cols-2">
      {courses.length ? courses.map((course) => {
        const archived = course.status === 'archived';
        return <Card key={course._id} className="min-w-0 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-xl font-bold text-foreground">{course.title}</h2><StatusPill status={course.status} /></div><p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary-strong">{labelFor(COURSE_CATEGORIES, course.category)}</p></div>
            {course.featured ? <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-strong">Featured</span> : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{course.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">{(course.technologies || []).map((tech) => <span key={tech._id} className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">{tech.name}</span>)}</div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground"><span>{(course.availableLevels || []).map((level) => level[0].toUpperCase() + level.slice(1)).join(' · ')}</span>{course.primaryTechnology ? <span>• Primary: {course.primaryTechnology.name}</span> : null}</div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
            {!archived ? <Link to={`/admin/courses/${course._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : null}
            {!archived ? <Link to={`/admin/courses/${course._id}/workspace`} className="ui-button ui-button--secondary min-h-9 gap-1.5 px-3 text-xs"><BookOpenCheck size={14} /> Workspace</Link> : null}
            {course.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setStatusTarget({ item: course, status: 'published' })}>Publish</Button> : null}
            {!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => setStatusTarget({ item: course, status: 'archived' })}><Archive size={14} /> Archive</Button> : <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => setStatusTarget({ item: course, status: 'draft' })}><RotateCcw size={14} /> Restore</Button>}
            {course.status !== 'published' ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setDeleteTarget(course); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}
          </div>
        </Card>;
      }) : <div className="lg:col-span-2"><EmptyState title="No courses found" description="Create the first course or change the filters." /></div>}
    </div>

    <ConfirmDialog
      open={Boolean(statusTarget)}
      title={`${actionLabel} course?`}
      description={statusTarget?.status === 'published'
        ? 'Publishing is the final catalog gate. The backend checks published technologies and a published roadmap template for every enabled learner level before learners can discover the Course.'
        : statusTarget?.status === 'draft'
          ? 'Restoring returns this Course to Draft. Its curriculum stays intact, but learners cannot discover it until you explicitly publish it again.'
          : 'Archiving removes the Course from new learner discovery. Dependent learning paths and content remain protected by backend rules.'}
      confirmLabel={actionLabel}
      tone="primary"
      isLoading={updateStatus.isPending}
      onCancel={() => setStatusTarget(null)}
      onConfirm={() => updateStatus.mutate({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' }, { onSuccess: () => setStatusTarget(null) })}
    ><ErrorMessage message={updateStatus.error?.message} /></ConfirmDialog>

    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete course permanently?" description={`Delete “${deleteTarget?.title || ''}”. This is allowed only after its curriculum, templates, learning paths, and enrollments no longer depend on it.`} confirmLabel="Delete permanently" tone="danger" isLoading={deleteCourse.isPending} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => setDeleteTarget(null)} onConfirm={() => deleteCourse.mutate(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) })}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} /><ErrorMessage message={deleteCourse.error?.message} /></ConfirmDialog>
  </PageShell>;
}
