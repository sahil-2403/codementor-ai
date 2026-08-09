import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, GraduationCap } from 'lucide-react';
import QuestionForm from '../../components/admin/QuestionForm.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import {
  useAdminLessons,
  useAdminQuestion,
  useAdminTopics,
  useCreateQuestion,
  useUpdateQuestion
} from '../../queries/adminQueries.js';

export default function QuestionEditorPage({ bank = 'quiz' }) {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(questionId);
  const skillCheck = bank === 'skill_check';
  const basePath = skillCheck ? '/admin/questions/skill-checks' : '/admin/questions/quiz';

  const questionQuery = useAdminQuestion(questionId);
  const topicsQuery = useAdminTopics({ limit: 100, status: 'active' });
  const lessonsQuery = useAdminLessons({ limit: 100 }, !skillCheck);
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();

  if ((isEditing && questionQuery.isLoading) || topicsQuery.isLoading || (!skillCheck && lessonsQuery.isLoading)) {
    return <Loader label="Loading question editor..." />;
  }

  if (isEditing && questionQuery.error) {
    return <EmptyState title="Question is unavailable" description={questionQuery.error.message} actionLabel="Back to questions" onAction={() => navigate(basePath)} />;
  }

  if (topicsQuery.error || (!skillCheck && lessonsQuery.error)) {
    const error = topicsQuery.error || lessonsQuery.error;
    return <EmptyState title="Question editor is unavailable" description={error.message} actionLabel="Back to questions" onAction={() => navigate(basePath)} />;
  }

  const question = questionQuery.data?.question || null;
  const actualBank = question?.bank || 'quiz';
  const topics = topicsQuery.data?.topics || [];
  const lessons = lessonsQuery.data?.lessons || [];
  const mutation = isEditing ? updateQuestion : createQuestion;
  const archived = question?.status === 'archived';
  const blockedByParent = Boolean(question?.archivedByTopics?.length || question?.archivedByLessons?.length);

  if (isEditing && actualBank !== bank) {
    return <EmptyState title="Question belongs to another bank" description="Open this question from its correct management page." actionLabel="Back to question banks" onAction={() => navigate('/admin/questions')} />;
  }

  if (!isEditing && !topics.length) {
    return (
      <PageShell className="space-y-5 pb-6">
        <PageHeader
          variant="compact"
          eyebrow="Question administration"
          eyebrowIcon={skillCheck ? GraduationCap : ClipboardCheck}
          title={skillCheck ? 'Create skill check' : 'Create quiz question'}
          description="Create or restore an active Topic before adding question content."
          actions={<Link to={basePath} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} aria-hidden="true" /> Back to questions</Link>}
        />
        <EmptyState title="No active topics available" description="Questions must belong to an active Topic." actionLabel="Manage topics" onAction={() => navigate('/admin/topics')} />
      </PageShell>
    );
  }

  const submit = (payload) => {
    const options = { onSuccess: () => navigate(basePath) };
    if (isEditing) updateQuestion.mutate({ id: questionId, payload }, options);
    else createQuestion.mutate(payload, options);
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Question administration"
        eyebrowIcon={skillCheck ? GraduationCap : ClipboardCheck}
        title={isEditing ? `Edit ${skillCheck ? 'skill check' : 'quiz question'}` : `Create ${skillCheck ? 'skill-check' : 'quiz-question'} draft`}
        description={skillCheck
          ? 'Build a diagnostic question used before roadmap personalization. Lifecycle actions remain in Skill Check Management.'
          : 'Build a lesson-linked module question. Lifecycle actions remain in Quiz Question Management.'}
        actions={<Link to={basePath} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} aria-hidden="true" /> Back to questions</Link>}
      />

      {archived ? (
        <Card className="mx-auto w-full max-w-4xl border-amber-200 bg-amber-50/55 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">This question is archived</h2>
                <StatusPill status="archived" />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{blockedByParent ? 'A parent Topic or Lesson currently blocks this question. Manage the parent lifecycle before editing.' : 'Restore this question from its management page before editing it.'}</p>
            </div>
            <Link to={basePath} className="ui-button ui-button--secondary shrink-0">Open question management</Link>
          </div>
        </Card>
      ) : (
        <>
          <ErrorMessage message={mutation.error?.message} />
          <QuestionForm
            bank={bank}
            topics={topics}
            lessons={lessons}
            initialData={question}
            onSubmit={submit}
            onCancel={() => navigate(basePath)}
            isLoading={mutation.isPending}
          />
        </>
      )}
    </PageShell>
  );
}
