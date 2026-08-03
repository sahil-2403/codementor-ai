import { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import SectionHeader from '../../components/common/SectionHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import QuestionForm from '../../components/admin/QuestionForm.jsx';
import AdminFilters from '../../components/admin/AdminFilters.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { useAdminLessons, useAdminQuestions, useAdminTopics, useCreateQuestion, useUpdateQuestion, useUpdateQuestionStatus, useArchiveQuestion } from '../../queries/adminQueries.js';

export default function QuestionsPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 8, search: '', status: '', difficulty: '', topic: '', type: '' });
  const [editing, setEditing] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(null);
  const { data, isLoading } = useAdminQuestions(filters);
  const topics = useAdminTopics({ limit: 100 });
  const lessons = useAdminLessons({ limit: 100 });
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const updateStatus = useUpdateQuestionStatus();
  const archiveQuestion = useArchiveQuestion();

  if (isLoading || topics.isLoading || lessons.isLoading) return <Loader />;

  const questions = data?.questions || [];
  const submit = (payload) => {
    if (editing) updateQuestion.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) });
    else createQuestion.mutate(payload);
  };

  const publishQuestion = (question) => {
    const confirmed = window.confirm(`Publish this ${String(question.type).replace('_', ' ')} question? Its answer and references will be validated first.`);
    if (!confirmed) return;
    updateStatus.mutate({ id: question._id, status: 'published', confirmPublish: true });
  };

  const columns = [
    { key: 'question', header: 'Question', render: (question) => <div><b>{question.question}</b><p className="line-clamp-2 max-w-sm text-xs text-slate-500">Answer: {question.correctAnswer}</p></div> },
    { key: 'topic', header: 'Topic', render: (question) => question.topic?.title || 'No topic' },
    { key: 'type', header: 'Type', render: (question) => String(question.type).replace('_', ' ') },
    { key: 'difficulty', header: 'Level', render: (question) => <span className="capitalize">{question.difficulty}</span> },
    { key: 'status', header: 'Status', render: (question) => <StatusPill status={question.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'px-4 py-3 text-right',
      render: (question) => {
        const publishing = updateStatus.isPending && updateStatus.variables?.id === question._id;
        return <div className="flex flex-wrap justify-end gap-2">
          {question.status !== 'archived' && <Button type="button" variant="ghost" onClick={() => setEditing(question)}>Edit</Button>}
          {question.status === 'draft' && <Button type="button" variant="secondary" disabled={publishing} onClick={() => publishQuestion(question)}>{publishing ? 'Publishing...' : 'Publish'}</Button>}
          {question.status !== 'archived' && <Button type="button" variant="secondary" onClick={() => setConfirmArchive(question)}>Archive</Button>}
        </div>;
      }
    }
  ];

  return <PageShell>
    <PageHeader eyebrow="Admin CMS" title="Question CMS" description="Create question drafts, connect them to lessons, and publish only validated grading formats." />
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card><SectionHeader title={editing ? 'Edit question' : 'Create question draft'} description="MCQ answers must match an option. Short-answer questions remain draft-only until grading is supported." /><div className="mt-4"><QuestionForm topics={topics.data?.topics || []} lessons={lessons.data?.lessons || []} initialData={editing} onSubmit={submit} onCancel={editing ? () => setEditing(null) : null} isLoading={createQuestion.isPending || updateQuestion.isPending} /></div></Card>
      <Card>
        <SectionHeader title="Questions" description={`${data?.pagination?.total || 0} questions in bank.`} />
        <div className="mt-4"><AdminFilters filters={filters} setFilters={setFilters} topics={topics.data?.topics || []} includeType /></div>
        <div className="mt-4"><DataTable columns={columns} rows={questions} emptyTitle="No questions found" emptyDescription="Create a question or change your filters." minWidth={900} /></div>
        <PaginationControls pagination={data?.pagination} setFilters={setFilters} />
      </Card>
    </div>
    <ConfirmDialog open={Boolean(confirmArchive)} title="Archive question?" description="Archived questions stay in history but are removed from active learner-facing flows." confirmLabel="Archive question" isLoading={archiveQuestion.isPending} onCancel={() => setConfirmArchive(null)} onConfirm={() => archiveQuestion.mutate(confirmArchive._id, { onSuccess: () => setConfirmArchive(null) })} />
  </PageShell>;
}
