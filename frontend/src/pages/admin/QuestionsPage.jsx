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
import { useAdminQuestions, useAdminTopics, useCreateQuestion, useUpdateQuestion, useUpdateQuestionStatus, useArchiveQuestion } from '../../queries/adminQueries.js';

export default function QuestionsPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 8, search: '', status: '', difficulty: '', topic: '', type: '' });
  const [editing, setEditing] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(null);
  const { data, isLoading } = useAdminQuestions(filters);
  const topics = useAdminTopics({ limit: 100 });
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const updateStatus = useUpdateQuestionStatus();
  const archiveQuestion = useArchiveQuestion();
  if (isLoading || topics.isLoading) return <Loader />;
  const questions = data?.questions || [];
  const submit = (payload) => {
    if (editing) updateQuestion.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) });
    else createQuestion.mutate(payload);
  };

  const columns = [
    { key: 'question', header: 'Question', render: (q) => <div><b>{q.question}</b><p className="line-clamp-2 max-w-sm text-xs text-slate-500">Answer: {q.correctAnswer}</p></div> },
    { key: 'topic', header: 'Topic', render: (q) => q.topic?.title || 'No topic' },
    { key: 'type', header: 'Type', render: (q) => String(q.type).replace('_', ' ') },
    { key: 'difficulty', header: 'Level', render: (q) => <span className="capitalize">{q.difficulty}</span> },
    { key: 'status', header: 'Status', render: (q) => <StatusPill status={q.status} /> },
    { key: 'actions', header: 'Actions', cellClassName: 'px-4 py-3 text-right', render: (q) => <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEditing(q)}>Edit</Button>{q.status !== 'published' && <Button type="button" variant="secondary" onClick={() => updateStatus.mutate({ id: q._id, status: 'published' })}>Publish</Button>}{q.status !== 'draft' && <Button type="button" variant="secondary" onClick={() => updateStatus.mutate({ id: q._id, status: 'draft' })}>Draft</Button>}{q.status !== 'archived' && <Button type="button" variant="secondary" onClick={() => setConfirmArchive(q)}>Archive</Button>}</div> }
  ];

  return <PageShell>
    <PageHeader eyebrow="Admin CMS" title="Question CMS" description="Manage the diagnostic, quiz, and interview-support question bank with a consistent lifecycle workflow." />
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card><SectionHeader title={editing ? 'Edit question' : 'Create question'} description="Questions can power assessments, module quizzes, weak-topic detection, and interview practice." /><div className="mt-4"><QuestionForm topics={topics.data?.topics || []} initialData={editing} onSubmit={submit} onCancel={editing ? () => setEditing(null) : null} isLoading={createQuestion.isPending || updateQuestion.isPending} /></div></Card>
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
