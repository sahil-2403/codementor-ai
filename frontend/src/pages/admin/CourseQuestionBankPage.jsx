import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, FileQuestion, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useAdminCourses, useAdminQuestions, useDeleteQuestion, useUpdateQuestionStatus } from '../../queries/adminQueries.js';

const bankMeta = {
  quiz: { title: 'Quiz questions', singular: 'Quiz question', description: 'Course-linked questions used by roadmap module quizzes. Published templates depend on their Quiz-bank tags.', path: 'quiz' },
  skill_check: { title: 'Skill checks', singular: 'Skill check', description: 'Course-specific diagnostic questions for Intermediate and Advanced learners.', path: 'skill-checks' }
};

export default function CourseQuestionBankPage({ bank = 'quiz' }) {
  const meta = bankMeta[bank];
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', course: searchParams.get('course') || '', bank });
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const questionsQuery = useAdminQuestions(filters);
  const coursesQuery = useAdminCourses({ limit: 100 });
  const updateStatus = useUpdateQuestionStatus();
  const deleteQuestion = useDeleteQuestion();
  if (questionsQuery.isLoading || coursesQuery.isLoading) return <Loader label={`Loading ${meta.title.toLowerCase()}...`} />;
  const questions = questionsQuery.data?.questions || [];
  const courses = (coursesQuery.data?.courses || []).filter((course) => course.status !== 'archived');
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course assessments" eyebrowIcon={FileQuestion} title={meta.title} description={meta.description} actions={<Link to={filters.course ? `/admin/questions/${meta.path}/new?course=${filters.course}` : `/admin/questions/${meta.path}/new`} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add question</Link>} />
    <ErrorMessage message={questionsQuery.error?.message || coursesQuery.error?.message} />
    <Card className="shadow-sm"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Select label="Course" value={filters.course} onChange={(e) => update('course', e.target.value)}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><Input label="Search" value={filters.search} onChange={(e) => update('search', e.target.value)} placeholder="Question or tag" /><Select label="Difficulty" value={filters.difficulty} onChange={(e) => update('difficulty', e.target.value)}><option value="">All difficulties</option>{bank === 'quiz' ? <option value="beginner">Beginner</option> : null}<option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Select label="Status" value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div></Card>

    <div className="space-y-3">{questions.length ? questions.map((question) => {
      const archived = question.status === 'archived';
      return <Card key={question._id} className="min-w-0 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-base font-bold leading-6 text-foreground">{question.question}</h2><StatusPill status={question.status} /></div><p className="mt-1 text-xs font-semibold text-primary-strong">{question.course?.title || 'Unknown course'} · {question.topic?.title || 'Unknown topic'}</p><p className="mt-2 text-xs capitalize text-muted-foreground">{question.difficulty} · {String(question.type || '').replaceAll('_', ' ')}</p><div className="mt-3 flex flex-wrap gap-1.5">{(question.tags || []).map((tag) => <span key={tag} className="rounded-full bg-surface-secondary px-2 py-1 text-xs text-muted-foreground">{tag}</span>)}</div></div><div className="flex flex-wrap gap-2">{!archived ? <Link to={`/admin/questions/${meta.path}/${question._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => { updateStatus.reset(); setStatusTarget({ item: question, status: 'restored' }); }}>Restore</Button>}{question.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setStatusTarget({ item: question, status: 'published' })}>Publish</Button> : null}{!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { updateStatus.reset(); setStatusTarget({ item: question, status: 'archived' }); }}><Archive size={14} /> Archive</Button> : null}{archived ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { deleteQuestion.reset(); setDeleteTarget(question); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}</div></div></Card>;
    }) : <EmptyState title={`No ${meta.title.toLowerCase()} found`} description="Choose a Course, add its first question, or adjust the filters." />}</div>

    <ConfirmDialog open={Boolean(statusTarget)} title={statusTarget?.status === 'published' ? `Publish ${meta.singular.toLowerCase()}?` : statusTarget?.status === 'restored' ? `Restore ${meta.singular.toLowerCase()}?` : `Archive ${meta.singular.toLowerCase()}?`} description={statusTarget?.status === 'published' ? 'The Course and Topic must be available; Quiz questions also require a published related Lesson.' : statusTarget?.status === 'restored' ? 'Restore this question. If its Course, Topic, or related Lesson is archived, restore that parent first.' : bank === 'quiz' ? 'Archive this Quiz question before permanent deletion. If it is the last published question covering a tag required by a published Roadmap Template, the action will be blocked with instructions.' : 'Archive this Skill Check before permanent deletion. Parent content is not changed.'} confirmLabel={statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'restored' ? 'Restore' : 'Archive'} tone="primary" isLoading={updateStatus.isPending} onCancel={() => setStatusTarget(null)} onConfirm={() => updateStatus.mutate({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' }, { onSuccess: () => setStatusTarget(null) })}><LifecycleError error={updateStatus.error} /></ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title={`Delete archived ${meta.singular.toLowerCase()} permanently?`} description={`Permanently delete this archived ${meta.singular.toLowerCase()}. Parent Course, Topic, and Lesson are not changed. This cannot be undone.`} confirmLabel="Delete permanently" tone="danger" isLoading={deleteQuestion.isPending} confirmDisabled={deleteConfirmation !== 'DELETE'} onCancel={() => { setDeleteTarget(null); setDeleteConfirmation(''); }} onConfirm={() => deleteQuestion.mutate(deleteTarget._id, { onSuccess: () => { setDeleteTarget(null); setDeleteConfirmation(''); } })}><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} /><LifecycleError error={deleteQuestion.error} /></ConfirmDialog>
  </PageShell>;
}
