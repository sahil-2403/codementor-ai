import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, MessageSquareText, Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
  useAdminCourses,
  useAdminInterviewQuestions,
  useDeleteInterviewQuestion,
  useUpdateInterviewQuestionStatus
} from '../../queries/adminQueries.js';

export default function CourseInterviewQuestionsPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ page: 1, limit: 50, search: '', status: '', difficulty: '', type: '', course: searchParams.get('course') || '' });
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const questionsQuery = useAdminInterviewQuestions(filters);
  const coursesQuery = useAdminCourses({ limit: 100 });
  const updateStatus = useUpdateInterviewQuestionStatus();
  const deleteQuestion = useDeleteInterviewQuestion();

  if (questionsQuery.isLoading || coursesQuery.isLoading) return <Loader label="Loading interview questions..." />;
  const questions = questionsQuery.data?.interviewQuestions || [];
  const courses = (coursesQuery.data?.courses || []).filter((course) => course.status !== 'archived');
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  return (
    <PageShell className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Course interview practice"
        eyebrowIcon={MessageSquareText}
        title="Interview questions"
        description="Interview practice belongs to a Course and one of its Topics, so learners never receive unrelated stack or language questions."
        actions={<Link to={filters.course ? `/admin/questions/interview/new?course=${filters.course}` : '/admin/questions/interview/new'} className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add interview question</Link>}
      />
      <ErrorMessage message={questionsQuery.error?.message || coursesQuery.error?.message} />

      <Card className="shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select label="Course" value={filters.course} onChange={(event) => update('course', event.target.value)}>
            <option value="">All courses</option>
            {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
          </Select>
          <Input label="Search" value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Question, topic, tag" />
          <Select label="Difficulty" value={filters.difficulty} onChange={(event) => update('difficulty', event.target.value)}>
            <option value="">All difficulties</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </Select>
          <Select label="Type" value={filters.type} onChange={(event) => update('type', event.target.value)}>
            <option value="">All types</option><option value="definition">Definition</option><option value="concept">Concept</option><option value="output">Output</option><option value="scenario">Scenario</option><option value="debugging">Debugging</option><option value="system_design_lite">System design lite</option>
          </Select>
          <Select label="Status" value={filters.status} onChange={(event) => update('status', event.target.value)}>
            <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
          </Select>
        </div>
      </Card>

      <div className="space-y-3">
        {questions.length ? questions.map((question) => (
          <Card key={question._id} className="min-w-0 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-base font-bold leading-6 text-foreground">{question.question}</h2><StatusPill status={question.status} /></div>
                <p className="mt-1 text-xs font-semibold text-primary-strong">{question.course?.title || 'Unknown course'} · {question.topicRef?.title || question.topic || 'Unknown topic'}</p>
                <p className="mt-2 text-xs capitalize text-muted-foreground">{question.difficulty} · {String(question.type || '').replaceAll('_', ' ')}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{question.expectedAnswer}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {question.status !== 'archived' ? <Link to={`/admin/questions/interview/${question._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setStatusTarget({ item: question, status: 'restored' })}>Restore</Button>}
                {question.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setStatusTarget({ item: question, status: 'published' })}>Publish</Button> : null}
                {question.status !== 'archived' ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => setStatusTarget({ item: question, status: 'archived' })}><Archive size={14} /> Archive</Button> : null}
                <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setDeleteTarget(question); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button>
              </div>
            </div>
          </Card>
        )) : <EmptyState title="No interview questions found" description="Choose a Course, add its first interview question, or adjust the filters." />}
      </div>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={statusTarget?.status === 'published' ? 'Publish interview question?' : statusTarget?.status === 'restored' ? 'Restore interview question?' : 'Archive interview question?'}
        description={statusTarget?.status === 'published' ? 'The parent Course may be Draft or Published, but it cannot be Archived and the linked Topic must remain active. Publishing the Course later is the final learner-catalog gate.' : 'This lifecycle change keeps the question tied to its existing Course and Topic.'}
        confirmLabel={statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'restored' ? 'Restore' : 'Archive'}
        tone="primary"
        isLoading={updateStatus.isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => updateStatus.mutate({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' }, { onSuccess: () => setStatusTarget(null) })}
      ><ErrorMessage message={updateStatus.error?.message} /></ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete interview question permanently?"
        description="Learner interview attempts block permanent deletion. Archive the question when it already has learner history."
        confirmLabel="Delete permanently"
        tone="danger"
        isLoading={deleteQuestion.isPending}
        confirmDisabled={deleteConfirmation !== 'DELETE'}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteQuestion.mutate(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) })}
      ><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /><ErrorMessage message={deleteQuestion.error?.message} /></ConfirmDialog>
    </PageShell>
  );
}
