import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquareQuote } from 'lucide-react';
import InterviewQuestionForm from '../../components/admin/InterviewQuestionForm.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import {
  useAdminInterviewQuestion,
  useAdminTopics,
  useCreateInterviewQuestion,
  useUpdateInterviewQuestion
} from '../../queries/adminQueries.js';

export default function InterviewQuestionEditorPage() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(questionId);
  const questionQuery = useAdminInterviewQuestion(questionId);
  const topicsQuery = useAdminTopics({ limit: 100, status: 'active' });
  const createQuestion = useCreateInterviewQuestion();
  const updateQuestion = useUpdateInterviewQuestion();

  if ((isEditing && questionQuery.isLoading) || topicsQuery.isLoading) return <Loader label="Loading interview editor..." />;

  if (isEditing && questionQuery.error) {
    return <EmptyState title="Interview question is unavailable" description={questionQuery.error.message} actionLabel="Back to interview questions" onAction={() => navigate('/admin/questions/interview')} />;
  }

  if (topicsQuery.error) {
    return <EmptyState title="Topics are unavailable" description={topicsQuery.error.message} actionLabel="Back to interview questions" onAction={() => navigate('/admin/questions/interview')} />;
  }

  const question = questionQuery.data?.interviewQuestion || null;
  const topics = topicsQuery.data?.topics || [];
  const archived = question?.status === 'archived';
  const blockedByTopic = Boolean(question?.archivedByTopics?.length);
  const mutation = isEditing ? updateQuestion : createQuestion;

  if (!isEditing && !topics.length) {
    return (
      <PageShell className="space-y-5 pb-6">
        <PageHeader variant="compact" eyebrow="Question administration" eyebrowIcon={MessageSquareQuote} title="Create interview question" description="Create or restore an active Topic before adding interview content." actions={<Link to="/admin/questions/interview" className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} aria-hidden="true" /> Back to interview questions</Link>} />
        <EmptyState title="No active topics available" description="Interview questions must belong to an active Topic." actionLabel="Manage topics" onAction={() => navigate('/admin/topics')} />
      </PageShell>
    );
  }

  const submit = (payload) => {
    const options = { onSuccess: () => navigate('/admin/questions/interview') };
    if (isEditing) updateQuestion.mutate({ id: questionId, payload }, options);
    else createQuestion.mutate(payload, options);
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Question administration"
        eyebrowIcon={MessageSquareQuote}
        title={isEditing ? 'Edit interview question' : 'Create interview-question draft'}
        description="Build an interview prompt and its AI review guidance while keeping lifecycle actions in Interview Practice Management."
        actions={<Link to="/admin/questions/interview" className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} aria-hidden="true" /> Back to interview questions</Link>}
      />

      {archived ? (
        <Card className="mx-auto w-full max-w-4xl border-amber-200 bg-amber-50/55 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-foreground">This interview question is archived</h2><StatusPill status="archived" /></div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{blockedByTopic ? 'Its parent Topic is archived. Restore the Topic before managing this question lifecycle.' : 'Restore this question from Interview Practice Management before editing it.'}</p>
            </div>
            <Link to="/admin/questions/interview" className="ui-button ui-button--secondary shrink-0">Open interview management</Link>
          </div>
        </Card>
      ) : (
        <>
          <ErrorMessage message={mutation.error?.message} />
          <InterviewQuestionForm topics={topics} initialData={question} onSubmit={submit} onCancel={() => navigate('/admin/questions/interview')} isLoading={mutation.isPending} />
        </>
      )}
    </PageShell>
  );
}
