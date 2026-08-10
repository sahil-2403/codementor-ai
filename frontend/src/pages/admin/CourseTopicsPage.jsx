import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
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
import { useAdminCourses, useAdminTopics, useDeleteTopic, useUpdateTopicStatus } from '../../queries/adminQueries.js';

export default function CourseTopicsPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: searchParams.get('course') || '' });
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const topicsQuery = useAdminTopics(filters);
  const coursesQuery = useAdminCourses({ limit: 100 });
  const updateStatus = useUpdateTopicStatus();
  const deleteTopic = useDeleteTopic();
  if (topicsQuery.isLoading || coursesQuery.isLoading) return <Loader label="Loading course topics..." />;
  const topics = topicsQuery.data?.topics || [];
  const courses = (coursesQuery.data?.courses || []).filter((course) => course.status !== 'archived');
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course curriculum" eyebrowIcon={Tags} title="Topics" description="Topics organize content inside one Course. The same topic name may exist independently in another Course without mixing their lessons or questions." actions={<Link to={filters.course ? `/admin/topics/new?course=${filters.course}` : '/admin/topics/new'} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add topic</Link>} />
    <ErrorMessage message={topicsQuery.error?.message || coursesQuery.error?.message} />
    <Card className="shadow-sm"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Select label="Course" value={filters.course} onChange={(e) => update('course', e.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><Input label="Search" value={filters.search} onChange={(e) => update('search', e.target.value)} placeholder="Topic title or category" /><Select label="Difficulty" value={filters.difficulty} onChange={(e) => update('difficulty', e.target.value)}><option value="">All difficulties</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Select label="Status" value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="archived">Archived</option></Select></div></Card>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{topics.length ? topics.map((topic) => {
      const archived = topic.status === 'archived';
      return <Card key={topic._id} className="min-w-0 shadow-sm"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-lg font-bold text-foreground">{topic.title}</h2><StatusPill status={topic.status} /></div><p className="mt-1 text-xs font-semibold text-primary-strong">{topic.course?.title || 'Unknown course'}</p><p className="mt-3 text-sm text-muted-foreground">{topic.category} · <span className="capitalize">{topic.difficulty}</span></p><div className="mt-3 flex flex-wrap gap-1.5">{(topic.tags || []).map((tag) => <span key={tag} className="rounded-full bg-surface-secondary px-2 py-1 text-xs text-muted-foreground">{tag}</span>)}</div><div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">{!archived ? <Link to={`/admin/topics/${topic._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => { updateStatus.reset(); setStatusTarget({ item: topic, status: 'active' }); }}>Restore</Button>}{!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { updateStatus.reset(); setStatusTarget({ item: topic, status: 'archived' }); }}><Archive size={14} /> Archive</Button> : null}{archived ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { deleteTopic.reset(); setDeleteTarget(topic); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}</div></Card>;
    }) : <div className="md:col-span-2 xl:col-span-3"><EmptyState title="No topics found" description="Choose a Course, add its first topic, or adjust the filters." /></div>}</div>

    <ConfirmDialog open={Boolean(statusTarget)} title={statusTarget?.status === 'active' ? 'Restore topic and child content?' : 'Archive topic and child content?'} description={statusTarget?.status === 'active' ? 'Restore this Topic and all Lessons, Questions, Interview Questions, and dependent Projects affected by its archive. If the parent Course is archived, restore the Course first.' : 'Archive this Topic and its child curriculum together. A published Roadmap Template using one of its Lessons will block the action and tell you which template to handle first.'} confirmLabel={statusTarget?.status === 'active' ? 'Restore all' : 'Archive all'} tone="primary" isLoading={updateStatus.isPending} onCancel={() => setStatusTarget(null)} onConfirm={() => updateStatus.mutate({ id: statusTarget.item._id, status: statusTarget.status }, { onSuccess: () => setStatusTarget(null) })}><LifecycleError error={updateStatus.error} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete archived topic permanently?" description={`Permanently delete “${deleteTarget?.title || ''}” and its unused child Lessons, Questions, Interview Questions, and dependent Projects. Template references or learner history will block deletion.`} confirmLabel="Delete permanently" tone="danger" isLoading={deleteTopic.isPending} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }} onConfirm={() => deleteTopic.mutate(deleteTarget._id, { onSuccess: () => { setDeleteTarget(null); setDeleteConfirmation(''); } })}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} /><LifecycleError error={deleteTopic.error} /></ConfirmDialog>
  </PageShell>;
}
