import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenText } from 'lucide-react';
import LessonForm from '../../components/admin/LessonForm.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import {
  useAdminLesson,
  useAdminTopics,
  useCreateLesson,
  useUpdateLesson
} from '../../queries/adminQueries.js';

export default function LessonEditorPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(lessonId);
  const lessonQuery = useAdminLesson(lessonId);
  const topicsQuery = useAdminTopics({ limit: 100, status: 'active' });
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();

  if ((isEditing && lessonQuery.isLoading) || topicsQuery.isLoading) {
    return <Loader label="Loading lesson editor..." />;
  }

  if (isEditing && lessonQuery.error) {
    return (
      <EmptyState
        title="Lesson is unavailable"
        description={lessonQuery.error.message}
        actionLabel="Back to lessons"
        onAction={() => navigate('/admin/lessons')}
      />
    );
  }

  if (topicsQuery.error) {
    return (
      <EmptyState
        title="Topics are unavailable"
        description={topicsQuery.error.message}
        actionLabel="Back to lessons"
        onAction={() => navigate('/admin/lessons')}
      />
    );
  }

  const lesson = lessonQuery.data?.lesson || null;
  const topics = topicsQuery.data?.topics || [];
  const archived = lesson?.status === 'archived';
  const archivedByTopic = Boolean(lesson?.archivedByTopics?.length);
  const mutation = isEditing ? updateLesson : createLesson;

  if (!isEditing && !topics.length) {
    return (
      <PageShell className="space-y-5 pb-6">
        <PageHeader
          variant="compact"
          eyebrow="Content administration"
          eyebrowIcon={BookOpenText}
          title="Create lesson"
          description="Create an active topic before adding lesson content."
          actions={
            <Link to="/admin/lessons" className="ui-button ui-button--secondary gap-2">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to lessons
            </Link>
          }
        />
        <EmptyState
          title="No active topics available"
          description="Lessons must belong to an active topic. Create or restore a topic first."
          actionLabel="Manage topics"
          onAction={() => navigate('/admin/topics')}
        />
      </PageShell>
    );
  }

  const submit = (payload) => {
    const options = { onSuccess: () => navigate('/admin/lessons') };
    if (isEditing) {
      updateLesson.mutate({ id: lessonId, payload }, options);
    } else {
      createLesson.mutate(payload, options);
    }
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Content administration"
        eyebrowIcon={BookOpenText}
        title={isEditing ? 'Edit lesson' : 'Create lesson draft'}
        description={
          isEditing
            ? 'Refine the lesson learners use in their roadmap while keeping lifecycle actions separate from content editing.'
            : 'Build a structured lesson draft, then review and publish it from Lesson Management.'
        }
        actions={
          <Link to="/admin/lessons" className="ui-button ui-button--secondary gap-2">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to lessons
          </Link>
        }
      />

      {archived ? (
        <Card className="mx-auto w-full max-w-4xl border-amber-200 bg-amber-50/55 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">This lesson is archived</h2>
                <StatusPill status="archived" />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {archivedByTopic
                  ? 'This lesson is unavailable because its parent topic is archived. Restore the topic before managing the lesson lifecycle.'
                  : 'Restore this lesson from Lesson Management before editing it.'}
              </p>
            </div>
            <Link to="/admin/lessons" className="ui-button ui-button--secondary shrink-0">
              Open lesson management
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <ErrorMessage message={mutation.error?.message} />
          <LessonForm
            topics={topics}
            initialData={lesson}
            onSubmit={submit}
            onCancel={() => navigate('/admin/lessons')}
            isLoading={mutation.isPending}
          />
        </>
      )}
    </PageShell>
  );
}
