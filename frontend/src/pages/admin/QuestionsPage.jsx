import { useState } from 'react';
import AdminFilters from '../../components/admin/AdminFilters.jsx';
import AdminLifecycleGuide from '../../components/admin/AdminLifecycleGuide.jsx';
import InterviewQuestionForm from '../../components/admin/InterviewQuestionForm.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import QuestionForm from '../../components/admin/QuestionForm.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import SectionHeader from '../../components/common/SectionHeader.jsx';
import Select from '../../components/common/Select.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import {
  useAdminInterviewQuestions,
  useAdminLessons,
  useAdminQuestions,
  useAdminTopics,
  useArchiveInterviewQuestion,
  useArchiveQuestion,
  useCreateInterviewQuestion,
  useCreateQuestion,
  useUpdateInterviewQuestion,
  useUpdateInterviewQuestionStatus,
  useUpdateQuestion,
  useUpdateQuestionStatus
} from '../../queries/adminQueries.js';

const emptyQuizFilters = { page: 1, limit: 8, search: '', status: '', difficulty: '', topic: '', type: '' };
const emptyInterviewFilters = { page: 1, limit: 8, search: '', status: '', difficulty: '', topic: '', type: '' };

export default function QuestionsPage() {
  const [bank, setBank] = useState('quiz');
  const [quizFilters, setQuizFilters] = useState(emptyQuizFilters);
  const [interviewFilters, setInterviewFilters] = useState(emptyInterviewFilters);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingInterview, setEditingInterview] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const quizQuery = useAdminQuestions(quizFilters);
  const interviewQuery = useAdminInterviewQuestions(interviewFilters);
  const topicsQuery = useAdminTopics({ limit: 100 });
  const lessonsQuery = useAdminLessons({ limit: 100 });

  const createQuiz = useCreateQuestion();
  const updateQuiz = useUpdateQuestion();
  const updateQuizStatus = useUpdateQuestionStatus();
  const archiveQuiz = useArchiveQuestion();
  const createInterview = useCreateInterviewQuestion();
  const updateInterview = useUpdateInterviewQuestion();
  const updateInterviewStatus = useUpdateInterviewQuestionStatus();
  const archiveInterview = useArchiveInterviewQuestion();

  if (quizQuery.isLoading || interviewQuery.isLoading || topicsQuery.isLoading || lessonsQuery.isLoading) return <Loader label="Loading questions..." />;

  const quizQuestions = quizQuery.data?.questions || [];
  const interviewQuestions = interviewQuery.data?.interviewQuestions || [];
  const errorMessage = quizQuery.error?.message || interviewQuery.error?.message || topicsQuery.error?.message || lessonsQuery.error?.message || createQuiz.error?.message || updateQuiz.error?.message || updateQuizStatus.error?.message || archiveQuiz.error?.message || createInterview.error?.message || updateInterview.error?.message || updateInterviewStatus.error?.message || archiveInterview.error?.message;
  const switchBank = (nextBank) => {
    setBank(nextBank);
    setEditingQuiz(null);
    setEditingInterview(null);
    setPublishTarget(null);
    setArchiveTarget(null);
  };

  const submitQuiz = (payload) => {
    if (editingQuiz) updateQuiz.mutate({ id: editingQuiz._id, payload }, { onSuccess: () => setEditingQuiz(null) });
    else createQuiz.mutate(payload);
  };

  const submitInterview = (payload) => {
    if (editingInterview) updateInterview.mutate({ id: editingInterview._id, payload }, { onSuccess: () => setEditingInterview(null) });
    else createInterview.mutate(payload);
  };

  const confirmPublish = () => {
    if (!publishTarget) return;
    const mutation = publishTarget.kind === 'quiz' ? updateQuizStatus : updateInterviewStatus;
    mutation.mutate({ id: publishTarget.item._id, status: 'published', confirmPublish: true }, { onSuccess: () => setPublishTarget(null) });
  };

  const confirmArchive = () => {
    if (!archiveTarget) return;
    const mutation = archiveTarget.kind === 'quiz' ? archiveQuiz : archiveInterview;
    mutation.mutate(archiveTarget.item._id, { onSuccess: () => setArchiveTarget(null) });
  };

  const quizColumns = [
    { key: 'question', header: 'Question', render: (question) => <div><b className="text-foreground">{question.question}</b><p className="line-clamp-2 max-w-sm text-xs text-muted-foreground">Correct answer: {question.correctAnswer}</p></div> },
    { key: 'topic', header: 'Topic', render: (question) => question.topic?.title || 'No topic' },
    { key: 'type', header: 'Type', render: (question) => <span className="capitalize">{String(question.type).replaceAll('_', ' ')}</span> },
    { key: 'difficulty', header: 'Level', render: (question) => <span className="capitalize">{question.difficulty}</span> },
    { key: 'status', header: 'Status', render: (question) => <StatusPill status={question.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'px-4 py-3 text-right',
      render: (question) => <div className="flex flex-wrap justify-end gap-2">
        {question.status !== 'archived' ? <Button type="button" variant="ghost" onClick={() => setEditingQuiz(question)}>Edit</Button> : null}
        {question.status === 'draft' ? <Button type="button" variant="secondary" onClick={() => setPublishTarget({ kind: 'quiz', item: question })}>Publish</Button> : null}
        {question.status !== 'archived' ? <Button type="button" variant="secondary" onClick={() => setArchiveTarget({ kind: 'quiz', item: question })}>Archive</Button> : null}
      </div>
    }
  ];

  const interviewColumns = [
    { key: 'question', header: 'Question', render: (question) => <div><b className="text-foreground">{question.question}</b><p className="line-clamp-2 max-w-sm text-xs text-muted-foreground">{question.expectedAnswer}</p></div> },
    { key: 'topic', header: 'Topic', render: (question) => question.topic || 'No topic' },
    { key: 'type', header: 'Type', render: (question) => <span className="capitalize">{String(question.type).replaceAll('_', ' ')}</span> },
    { key: 'checklist', header: 'Review points', render: (question) => `${question.answerChecklist?.length || 0} item(s)` },
    { key: 'status', header: 'Status', render: (question) => <StatusPill status={question.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'px-4 py-3 text-right',
      render: (question) => <div className="flex flex-wrap justify-end gap-2">
        {question.status !== 'archived' ? <Button type="button" variant="ghost" onClick={() => setEditingInterview(question)}>Edit</Button> : null}
        {question.status === 'draft' ? <Button type="button" variant="secondary" onClick={() => setPublishTarget({ kind: 'interview', item: question })}>Publish</Button> : null}
        {question.status !== 'archived' ? <Button type="button" variant="secondary" onClick={() => setArchiveTarget({ kind: 'interview', item: question })}>Archive</Button> : null}
      </div>
    }
  ];

  const publishMutation = publishTarget?.kind === 'quiz' ? updateQuizStatus : updateInterviewStatus;
  const archiveMutation = archiveTarget?.kind === 'quiz' ? archiveQuiz : archiveInterview;
  const publishLabel = publishTarget?.kind === 'interview' ? 'interview question' : 'quiz question';
  const archiveLabel = archiveTarget?.kind === 'interview' ? 'interview question' : 'quiz question';

  return <PageShell>
    <PageHeader
      eyebrow="Content administration"
      title="Question banks"
      description="Manage quiz, skill-check, and interview questions in separate reviewed collections."
    />
    <AdminLifecycleGuide />
    <ErrorMessage message={errorMessage} />

    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Admin question banks">
      <Button type="button" role="tab" aria-selected={bank === 'quiz'} variant={bank === 'quiz' ? 'primary' : 'secondary'} onClick={() => switchBank('quiz')}>Quiz and skill checks</Button>
      <Button type="button" role="tab" aria-selected={bank === 'interview'} variant={bank === 'interview' ? 'primary' : 'secondary'} onClick={() => switchBank('interview')}>Interview practice</Button>
    </div>

    {bank === 'quiz' ? <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <SectionHeader title={editingQuiz ? 'Edit quiz question' : 'Create quiz-question draft'} description="For multiple-choice questions, the correct answer must exactly match one option. Short-answer questions cannot be published yet." />
        <div className="mt-4"><QuestionForm topics={topicsQuery.data?.topics || []} lessons={lessonsQuery.data?.lessons || []} initialData={editingQuiz} onSubmit={submitQuiz} onCancel={editingQuiz ? () => setEditingQuiz(null) : null} isLoading={createQuiz.isPending || updateQuiz.isPending} /></div>
      </Card>
      <Card>
        <SectionHeader title="Quiz and skill-check questions" description={`${quizQuery.data?.pagination?.total || 0} questions in this bank.`} />
        <div className="mt-4"><AdminFilters filters={quizFilters} setFilters={setQuizFilters} topics={topicsQuery.data?.topics || []} includeType /></div>
        <div className="mt-4"><DataTable columns={quizColumns} rows={quizQuestions} emptyTitle="No quiz questions found" emptyDescription="Create a draft or adjust the filters." minWidth={900} /></div>
        <PaginationControls pagination={quizQuery.data?.pagination} setFilters={setQuizFilters} />
      </Card>
    </div> : <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <SectionHeader title={editingInterview ? 'Edit interview question' : 'Create interview-question draft'} description="The example answer remains hidden until a learner submits the first attempt." />
        <div className="mt-4"><InterviewQuestionForm initialData={editingInterview} onSubmit={submitInterview} onCancel={editingInterview ? () => setEditingInterview(null) : null} isLoading={createInterview.isPending || updateInterview.isPending} /></div>
      </Card>
      <Card>
        <SectionHeader title="Interview questions" description={`${interviewQuery.data?.pagination?.total || 0} questions in this bank.`} />
        <div className="mt-4 grid gap-3 rounded-panel bg-surface-secondary p-4 md:grid-cols-2 xl:grid-cols-3">
          <Input label="Search" value={interviewFilters.search} onChange={(event) => setInterviewFilters((previous) => ({ ...previous, search: event.target.value, page: 1 }))} />
          <Input label="Topic" value={interviewFilters.topic} onChange={(event) => setInterviewFilters((previous) => ({ ...previous, topic: event.target.value, page: 1 }))} />
          <Select label="Type" value={interviewFilters.type} onChange={(event) => setInterviewFilters((previous) => ({ ...previous, type: event.target.value, page: 1 }))}>
            <option value="">All types</option><option value="definition">Definition</option><option value="concept">Concept</option><option value="output">Output</option><option value="scenario">Scenario</option><option value="debugging">Debugging</option><option value="system_design_lite">System design lite</option>
          </Select>
          <Select label="Difficulty" value={interviewFilters.difficulty} onChange={(event) => setInterviewFilters((previous) => ({ ...previous, difficulty: event.target.value, page: 1 }))}>
            <option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </Select>
          <Select label="Status" value={interviewFilters.status} onChange={(event) => setInterviewFilters((previous) => ({ ...previous, status: event.target.value, page: 1 }))}>
            <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
          </Select>
          <div className="flex items-end"><Button type="button" variant="secondary" className="w-full" onClick={() => setInterviewFilters(emptyInterviewFilters)}>Reset filters</Button></div>
        </div>
        <div className="mt-4"><DataTable columns={interviewColumns} rows={interviewQuestions} emptyTitle="No interview questions found" emptyDescription="Create a draft or adjust the filters." minWidth={900} /></div>
        <PaginationControls pagination={interviewQuery.data?.pagination} setFilters={setInterviewFilters} />
      </Card>
    </div>}

    <ConfirmDialog
      open={Boolean(publishTarget)}
      title={`Publish ${publishLabel}?`}
      description={publishTarget?.kind === 'interview'
        ? 'Add an example answer of at least 20 characters and at least one review point before publishing.'
        : 'Check the answer, topic, related lesson, and question type before publishing.'}
      confirmLabel={`Publish ${publishLabel}`}
      tone="primary"
      isLoading={publishMutation.isPending}
      onCancel={() => setPublishTarget(null)}
      onConfirm={confirmPublish}
    />
    <ConfirmDialog
      open={Boolean(archiveTarget)}
      title={`Archive ${archiveLabel}?`}
      description="Archived questions are removed from learner pages and kept as read-only history."
      confirmLabel={`Archive ${archiveLabel}`}
      isLoading={archiveMutation.isPending}
      onCancel={() => setArchiveTarget(null)}
      onConfirm={confirmArchive}
    />
  </PageShell>;
}
