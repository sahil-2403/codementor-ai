import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  MessageSquareQuote,
  Pencil,
  Plus,
  RotateCcw,
  Tags,
  Trash2
} from 'lucide-react';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import {
  useAdminInterviewQuestionImpact,
  useAdminInterviewQuestions,
  useAdminTopics,
  useDeleteInterviewQuestion,
  useUpdateInterviewQuestionStatus
} from '../../queries/adminQueries.js';
import { formatDate } from '../../utils/formatDate.js';

const emptyFilters = { page: 1, limit: 10, search: '', topic: '', type: '', difficulty: '', status: '' };

export default function InterviewQuestionsPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [actionTarget, setActionTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const questionsQuery = useAdminInterviewQuestions(filters);
  const topicsQuery = useAdminTopics({ limit: 100 });
  const updateStatus = useUpdateInterviewQuestionStatus();
  const deleteQuestion = useDeleteInterviewQuestion();
  const needsImpact = ['archive', 'restore', 'delete'].includes(actionTarget?.mode);
  const impactQuery = useAdminInterviewQuestionImpact(actionTarget?.question?._id, Boolean(actionTarget?.question) && needsImpact);

  if (questionsQuery.isLoading || topicsQuery.isLoading) return <Loader label="Loading interview questions..." />;

  const questions = questionsQuery.data?.interviewQuestions || [];
  const topics = topicsQuery.data?.topics || [];
  const impact = impactQuery.data?.impact || {};
  const errorMessage = questionsQuery.error?.message || topicsQuery.error?.message || updateStatus.error?.message || deleteQuestion.error?.message || impactQuery.error?.message;

  const updateFilter = (key, value) => setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
  const openAction = (mode, question) => {
    setDeleteConfirmation('');
    setActionTarget({ mode, question });
  };
  const closeDialog = () => {
    setActionTarget(null);
    setDeleteConfirmation('');
  };
  const confirmStatus = () => {
    if (!actionTarget?.question) return;
    const status = actionTarget.mode === 'publish' ? 'published' : actionTarget.mode === 'restore' ? 'restored' : 'archived';
    updateStatus.mutate({ id: actionTarget.question._id, status, confirmPublish: status === 'published' }, { onSuccess: closeDialog });
  };
  const confirmDelete = () => {
    if (!actionTarget?.question || deleteConfirmation !== 'DELETE') return;
    deleteQuestion.mutate(actionTarget.question._id, { onSuccess: closeDialog });
  };

  const columns = [
    {
      key: 'question',
      header: 'Question',
      render: (question) => (
        <div className="min-w-0">
          <p className="line-clamp-2 max-w-md font-bold text-foreground">{question.question}</p>
          <p className="mt-1 line-clamp-1 max-w-sm text-xs text-muted-foreground">{question.expectedAnswer}</p>
        </div>
      )
    },
    { key: 'topic', header: 'Topic', render: (question) => question.topicRef?.title || question.topic || 'No topic' },
    { key: 'type', header: 'Type', render: (question) => <span className="capitalize">{String(question.type).replaceAll('_', ' ')}</span> },
    { key: 'difficulty', header: 'Level', render: (question) => <span className="capitalize">{question.difficulty}</span> },
    { key: 'checklist', header: 'Review points', render: (question) => `${question.answerChecklist?.length || 0} item(s)` },
    {
      key: 'status',
      header: 'Status',
      render: (question) => (
        <div>
          <StatusPill status={question.status} />
          {question.archivedByTopics?.length ? <p className="mt-1 text-[11px] font-semibold text-muted-foreground">By parent topic</p> : null}
        </div>
      )
    },
    { key: 'updatedAt', header: 'Updated', render: (question) => <span className="text-sm text-muted-foreground">{formatDate(question.updatedAt || question.createdAt)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'px-4 py-3 text-right',
      render: (question) => {
        const archived = question.status === 'archived';
        const topicBlocked = Boolean(question.archivedByTopics?.length);
        return (
          <div className="flex flex-wrap justify-end gap-2">
            {!archived ? <Link to={`/admin/questions/interview/${question._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} aria-hidden="true" /> Edit</Link> : null}
            {question.status === 'draft' ? <Button type="button" variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => openAction('publish', question)}>Publish</Button> : null}
            {!archived ? <Button type="button" variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => openAction('archive', question)}><Archive size={14} aria-hidden="true" /> Archive</Button> : topicBlocked ? <Link to="/admin/topics" className="ui-button ui-button--secondary min-h-9 gap-1.5 px-3 text-xs"><Tags size={14} aria-hidden="true" /> Manage topic</Link> : <Button type="button" variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => openAction('restore', question)}><RotateCcw size={14} aria-hidden="true" /> Restore</Button>}
            <Button type="button" variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => openAction('delete', question)}><Trash2 size={14} aria-hidden="true" /> Delete</Button>
          </div>
        );
      }
    }
  ];

  const isPublish = actionTarget?.mode === 'publish';
  const isDelete = actionTarget?.mode === 'delete';
  const isRestore = actionTarget?.mode === 'restore';

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Question administration"
        eyebrowIcon={MessageSquareQuote}
        title="Interview practice"
        description="Manage open-answer interview prompts, expected answers, and AI review criteria."
        actions={<Link to="/admin/questions/interview/new" className="ui-button ui-button--primary gap-2"><Plus size={16} aria-hidden="true" /> Create interview question</Link>}
      />

      <ErrorMessage message={errorMessage} />

      <Card className="shadow-sm">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Interview-question library</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">Manage interview prompts</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{questionsQuery.data?.pagination?.total || 0} question(s) match the current filters.</p>
        </div>

        <div className="mt-5 grid gap-3 rounded-panel border border-border bg-surface-secondary/45 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_1fr_1fr_1fr_1fr_auto]">
          <Input label="Search" placeholder="Question, answer, topic, or tag" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
          <Select label="Topic" value={filters.topic} onChange={(event) => updateFilter('topic', event.target.value)}>
            <option value="">All topics</option>
            {topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}{topic.status === 'archived' ? ' (Archived)' : ''}</option>)}
          </Select>
          <Select label="Type" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
            <option value="">All types</option><option value="definition">Definition</option><option value="concept">Concept</option><option value="output">Output</option><option value="scenario">Scenario</option><option value="debugging">Debugging</option><option value="system_design_lite">System design lite</option>
          </Select>
          <Select label="Difficulty" value={filters.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}>
            <option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </Select>
          <Select label="Status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
          </Select>
          <div className="flex items-end"><Button type="button" variant="secondary" className="w-full xl:w-auto" onClick={() => setFilters(emptyFilters)}>Reset</Button></div>
        </div>

        <div className="mt-4"><DataTable columns={columns} rows={questions} emptyTitle="No interview questions found" emptyDescription="Create a draft or change the current filters." minWidth={1150} label="Admin interview-question library" /></div>
        <PaginationControls pagination={questionsQuery.data?.pagination} setFilters={setFilters} />
      </Card>

      <ConfirmDialog open={Boolean(actionTarget) && isPublish} title="Publish interview question?" description="Publishing makes this prompt available for learner interview practice and AI review." confirmLabel="Publish interview question" tone="primary" isLoading={updateStatus.isPending} loadingLabel="Publishing..." onCancel={closeDialog} onConfirm={confirmStatus}>
        {updateStatus.error?.errors?.length ? <ul className="space-y-1 text-sm text-rose-700">{updateStatus.error.errors.map((item, index) => <li key={`${item.field}-${index}`}>• {item.message}</li>)}</ul> : null}
      </ConfirmDialog>

      <ConfirmDialog open={Boolean(actionTarget) && !isPublish && !isDelete} title={isRestore ? 'Restore interview question?' : 'Archive interview question?'} description={isRestore ? 'Restore this prompt to its previous draft or published state.' : 'Archive this prompt so it is unavailable for new learner practice while preserving existing attempts.'} confirmLabel={isRestore ? 'Restore interview question' : 'Archive interview question'} tone="primary" isLoading={updateStatus.isPending} confirmDisabled={impactQuery.isLoading || impactQuery.isError} loadingLabel={isRestore ? 'Restoring...' : 'Archiving...'} onCancel={closeDialog} onConfirm={confirmStatus}>
        {impactQuery.isLoading ? <p className="text-sm text-muted-foreground">Checking current usage...</p> : impactQuery.isError ? <ErrorMessage message={impactQuery.error?.message} /> : <div className="rounded-surface border border-border bg-surface-secondary/55 px-4 py-3"><p className="text-xl font-extrabold tracking-tight text-foreground">{impact.interviewAttempts || 0}</p><p className="mt-0.5 text-xs font-semibold text-muted-foreground">Existing interview attempts preserved</p></div>}
      </ConfirmDialog>

      <ConfirmDialog open={Boolean(actionTarget) && isDelete} title="Delete interview question permanently?" description={`Delete “${actionTarget?.question?.question || ''}”. Related interview attempts will also be permanently deleted.`} confirmLabel="Delete permanently" tone="danger" isLoading={deleteQuestion.isPending} confirmDisabled={impactQuery.isLoading || impactQuery.isError || deleteConfirmation !== 'DELETE'} loadingLabel="Deleting..." onCancel={closeDialog} onConfirm={confirmDelete}>
        {impactQuery.isLoading ? <p className="text-sm text-muted-foreground">Checking deletion impact...</p> : impactQuery.isError ? <ErrorMessage message={impactQuery.error?.message} /> : <div className="space-y-5"><div className="rounded-surface border border-rose-200 bg-rose-50/70 p-4"><p className="text-xl font-extrabold tracking-tight text-rose-800">{impact.interviewAttempts || 0}</p><p className="mt-1 text-sm font-semibold text-rose-700">Interview attempt(s) will be permanently deleted.</p></div><Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" /></div>}
      </ConfirmDialog>
    </PageShell>
  );
}
