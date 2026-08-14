import { useEffect, useState } from 'react';
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
import { adminApi } from '../../api/adminApi.js';

export default function CourseTopicsPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: searchParams.get('course') || '' });
  const [topics, setTopics] = useState([]);
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
    Promise.all([adminApi.topics(filters), adminApi.courses({ limit: 100 })])
      .then(([topicResult, courseResult]) => {
        if (!active) return;
        setTopics(topicResult?.topics || []);
        setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
      })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters, loadAttempt]);

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const changeStatus = async () => {
    if (!statusTarget) return;
    setActionLoading(true); setActionError(null);
    try { await adminApi.updateTopicStatus({ id: statusTarget.item._id, status: statusTarget.status }); setStatusTarget(null); setLoadAttempt((value) => value + 1); }
    catch (requestError) { setActionError(requestError); }
    finally { setActionLoading(false); }
  };
  const deleteItem = async () => {
    if (!deleteTarget) return;
    setActionLoading(true); setActionError(null);
    try { await adminApi.deleteTopic(deleteTarget._id); setDeleteTarget(null); setDeleteConfirmation(''); setLoadAttempt((value) => value + 1); }
    catch (requestError) { setActionError(requestError); }
    finally { setActionLoading(false); }
  };

  if (isLoading) return <Loader label="Loading course topics..." />;
  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course curriculum" eyebrowIcon={Tags} title="Topics" description="Topics organize content inside one Course." actions={<Link to={filters.course ? `/admin/topics/new?course=${filters.course}` : '/admin/topics/new'} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add topic</Link>} />
    <ErrorMessage message={error?.message} />
    <Card><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Select label="Course" value={filters.course} onChange={(e) => update('course', e.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><Input label="Search" value={filters.search} onChange={(e) => update('search', e.target.value)} /><Select label="Difficulty" value={filters.difficulty} onChange={(e) => update('difficulty', e.target.value)}><option value="">All difficulties</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Select label="Status" value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="archived">Archived</option></Select></div></Card>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{topics.length ? topics.map((topic) => { const archived = topic.status === 'archived'; return <Card key={topic._id}><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{topic.title}</h2><StatusPill status={topic.status} /></div><p className="mt-1 text-xs font-semibold text-primary-strong">{topic.course?.title || 'Unknown course'}</p><p className="mt-3 text-sm text-muted-foreground">{topic.category} · <span className="capitalize">{topic.difficulty}</span></p><div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">{!archived ? <Link to={`/admin/topics/${topic._id}/edit`} className="ui-button ui-button--ghost min-h-9 px-3 text-xs"><Pencil size={14} /> Edit</Link> : <Button variant="secondary" onClick={() => { setActionError(null); setStatusTarget({ item: topic, status: 'active' }); }}>Restore</Button>}{!archived ? <Button variant="secondary" onClick={() => { setActionError(null); setStatusTarget({ item: topic, status: 'archived' }); }}><Archive size={14} /> Archive</Button> : null}{archived ? <Button variant="danger" onClick={() => { setActionError(null); setDeleteTarget(topic); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}</div></Card>; }) : <div className="md:col-span-2 xl:col-span-3"><EmptyState title="No topics found" description="Add a topic or adjust the filters." /></div>}</div>
    <ConfirmDialog open={Boolean(statusTarget)} title={statusTarget?.status === 'active' ? 'Restore topic and child content?' : 'Archive topic and child content?'} confirmLabel={statusTarget?.status === 'active' ? 'Restore all' : 'Archive all'} isLoading={actionLoading} onCancel={() => setStatusTarget(null)} onConfirm={changeStatus}><LifecycleError error={actionError} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete archived topic permanently?" confirmLabel="Delete permanently" tone="danger" isLoading={actionLoading} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }} onConfirm={deleteItem}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} /><LifecycleError error={actionError} /></ConfirmDialog>
  </PageShell>;
}
