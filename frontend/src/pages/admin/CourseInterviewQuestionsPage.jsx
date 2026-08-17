import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, MessageSquareText, Pencil, Plus, Trash2 } from 'lucide-react';
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

export default function CourseInterviewQuestionsPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', type: '', course: searchParams.get('course') || '' });
  const [questions, setQuestions] = useState([]);
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
    Promise.all([adminApi.interviewQuestions(filters), adminApi.courses({ limit: 100 })])
      .then(([questionResult, courseResult]) => {
        if (!active) return;
        setQuestions(questionResult?.interviewQuestions || []);
        setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
      })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters, loadAttempt]);

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const resetFilters = () => setFilters({ page: 1, limit: 50, search: '', status: '', difficulty: '', type: '', course: '' });

  const changeStatus = async () => {
    if (!statusTarget) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.updateInterviewQuestionStatus({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' });
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
      await adminApi.deleteInterviewQuestion(deleteTarget._id);
      setDeleteTarget(null);
      setDeleteConfirmation('');
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <Loader label="Loading interview questions..." />;

  return (
    <PageShell className="space-y-5 pb-8">
      <PageHeader eyebrow="Course interview practice" eyebrowIcon={MessageSquareText} title="Interview questions" description="Create and manage interview questions for each course." actions={<Link to={filters.course ? `/admin/questions/interview/new?course=${filters.course}` : '/admin/questions/interview/new'} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add interview question</Link>} />
      <ErrorMessage message={error?.message} />

      <div className="grid gap-3 rounded-surface border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-6">
        <Input label="Search" value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Question or topic" />
        <Select label="Course" value={filters.course} onChange={(event) => update('course', event.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>
        <Select label="Difficulty" value={filters.difficulty} onChange={(event) => update('difficulty', event.target.value)}><option value="">All difficulties</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
        <Select label="Type" value={filters.type} onChange={(event) => update('type', event.target.value)}><option value="">All types</option><option value="definition">Definition</option><option value="concept">Concept</option><option value="output">Output</option><option value="scenario">Scenario</option><option value="debugging">Debugging</option><option value="system_design_lite">System design lite</option></Select>
        <Select label="Status" value={filters.status} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select>
        <div className="flex items-end"><Button type="button" variant="secondary" className="w-full" onClick={resetFilters}>Reset</Button></div>
      </div>

      <div className="space-y-3">
        {questions.length ? questions.map((question) => {
          const archived = question.status === 'archived';
          return (
            <Card key={question._id} className="min-w-0 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-base font-bold leading-6 text-foreground">{question.question}</h2><StatusPill status={question.status} /><LevelBadge level={question.difficulty} /></div>
                  <p className="mt-1 text-xs font-semibold text-primary-strong">{question.course?.title || 'Unknown course'} · {question.topicRef?.title || question.topic || 'Unknown topic'}</p>
                  <p className="mt-2 text-xs capitalize text-muted-foreground">{String(question.type || '').replaceAll('_', ' ')}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{question.expectedAnswer}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!archived ? <Link to={`/admin/questions/interview/${question._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setStatusTarget({ item: question, status: 'restored' })}>Restore</Button>}
                  {question.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setStatusTarget({ item: question, status: 'published' })}>Publish</Button> : null}
                  {!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => setStatusTarget({ item: question, status: 'archived' })}><Archive size={14} /> Archive</Button> : null}
                  {archived ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setDeleteTarget(question); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}
                </div>
              </div>
            </Card>
          );
        }) : <EmptyState title="No interview questions found" description="Create an interview question or adjust the filters." />}
      </div>

      <ConfirmDialog open={Boolean(statusTarget)} title={statusTarget?.status === 'published' ? 'Publish interview question?' : statusTarget?.status === 'restored' ? 'Restore interview question?' : 'Archive interview question?'} description={statusTarget?.status === 'published' ? 'The course and linked topic must be available.' : statusTarget?.status === 'restored' ? 'If the course or topic is archived, restore that parent first.' : 'Archive this interview question before permanent deletion.'} confirmLabel={statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'restored' ? 'Restore' : 'Archive'} tone="primary" isLoading={actionLoading} onCancel={() => setStatusTarget(null)} onConfirm={changeStatus}><LifecycleError error={actionError} /></ConfirmDialog>
      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete archived interview question permanently?" description="Learner interview attempts will block deletion. If that happens, keep the question archived." confirmLabel="Delete permanently" tone="danger" isLoading={actionLoading} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }} onConfirm={deleteItem}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /><LifecycleError error={actionError} /></ConfirmDialog>
    </PageShell>
  );
}
