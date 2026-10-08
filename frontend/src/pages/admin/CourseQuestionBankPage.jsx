import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, FileQuestion, Pencil, Plus, Trash2 } from 'lucide-react';
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

const bankMeta = {
  quiz: {
    title: 'Quiz questions',
    singular: 'Quiz question',
    description: 'Course-linked questions used by roadmap module quizzes.',
    path: 'quiz'
  },
  skill_check: {
    title: 'Skill checks',
    singular: 'Skill check',
    description: 'Course-specific diagnostic questions for Intermediate and Advanced learners.',
    path: 'skill-checks'
  }
};

export default function CourseQuestionBankPage({ bank = 'quiz' }) {
  const meta = bankMeta[bank];
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: searchParams.get('course') || '', bank });
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
    Promise.all([adminApi.questions(filters), adminApi.courses({ limit: 100 })])
      .then(([questionResult, courseResult]) => {
        if (!active) return;
        setQuestions(questionResult?.questions || []);
        setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
      })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters, loadAttempt]);

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const resetFilters = () => setFilters({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: '', bank });

  const changeStatus = async () => {
    if (!statusTarget) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.updateQuestionStatus({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' });
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
      await adminApi.deleteQuestion(deleteTarget._id);
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

  if (isLoading) return <Loader label={`Loading ${meta.title.toLowerCase()}...`} />;

  return (
    <PageShell className="space-y-5 pb-8">
      <PageHeader eyebrow="Course assessments" eyebrowIcon={FileQuestion} title={meta.title} description={meta.description} actions={<Link to={filters.course ? `/admin/questions/${meta.path}/new?course=${filters.course}` : `/admin/questions/${meta.path}/new`} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add question</Link>} />
      <ErrorMessage message={error?.message} />

      <AdminFilterPanel>
        <Input label="Search" value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Question text" />
        <Select label="Course" value={filters.course} onChange={(event) => update('course', event.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>
        <Select label="Difficulty" value={filters.difficulty} onChange={(event) => update('difficulty', event.target.value)}><option value="">All difficulties</option>{bank === 'quiz' ? <option value="beginner">Beginner</option> : null}<option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
        <Select label="Status" value={filters.status} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select>
        <div className="flex items-end"><Button type="button" variant="secondary" className="w-full" onClick={resetFilters}>Reset</Button></div>
      </AdminFilterPanel>

      <div className="space-y-3">
        {questions.length ? questions.map((question) => {
          const archived = question.status === 'archived';
          return (
            <Card key={question._id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-base font-bold">{question.question}</h2><StatusPill status={question.status} /><LevelBadge level={question.difficulty} /></div>
                  <p className="mt-1 text-xs font-semibold text-primary-strong">{question.course?.title || 'Unknown course'} · {question.topic?.title || 'Unknown topic'}</p>
                  <p className="mt-2 text-xs capitalize text-muted-foreground">{String(question.type || '').replaceAll('_', ' ')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!archived ? <Link to={`/admin/questions/${meta.path}/${question._id}/edit`} className="ui-button ui-button--ghost min-h-9 px-3 text-xs"><Pencil size={14} /> Edit</Link> : <Button variant="secondary" onClick={() => setStatusTarget({ item: question, status: 'restored' })}>Restore</Button>}
                  {question.status === 'draft' ? <Button variant="secondary" onClick={() => setStatusTarget({ item: question, status: 'published' })}>Publish</Button> : null}
                  {!archived ? <Button variant="secondary" onClick={() => setStatusTarget({ item: question, status: 'archived' })}><Archive size={14} /> Archive</Button> : null}
                  {archived ? <Button variant="danger" onClick={() => { setDeleteTarget(question); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}
                </div>
              </div>
            </Card>
          );
        }) : <EmptyState title={`No ${meta.title.toLowerCase()} found`} description="Add a question or adjust the filters." />}
      </div>

      <ConfirmDialog open={Boolean(statusTarget)} title={statusTarget?.status === 'published' ? `Publish ${meta.singular.toLowerCase()}?` : statusTarget?.status === 'restored' ? `Restore ${meta.singular.toLowerCase()}?` : `Archive ${meta.singular.toLowerCase()}?`} confirmLabel={statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'restored' ? 'Restore' : 'Archive'} isLoading={actionLoading} onCancel={() => setStatusTarget(null)} onConfirm={changeStatus}><LifecycleError error={actionError} /></ConfirmDialog>
      <PermanentDeleteDialog
        open={Boolean(deleteTarget)}
        title={`Delete archived ${meta.singular.toLowerCase()} permanently?`}
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
