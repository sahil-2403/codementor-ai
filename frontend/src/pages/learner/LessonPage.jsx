import { Link, useNavigate, useParams } from "react-router-dom";
import { BookOpenCheck, BookOpenText, MessagesSquare } from "lucide-react";
import Loader from "../../components/common/Loader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import PageShell from "../../components/common/PageShell.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import LessonContent from "../../components/lesson/LessonContent.jsx";
import { useCompleteLesson, useLesson } from "../../queries/lessonQueries.js";

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useLesson(lessonId);
  const completeMutation = useCompleteLesson();

  if (isLoading) return <Loader label="Loading lesson..." />;
  if (error)
    return (
      <EmptyState
        title="Lesson is unavailable"
        description={error.message}
        actionLabel="Back to roadmap"
        onAction={() => navigate("/roadmap")}
      />
    );

  const lesson = data?.lesson;
  if (!lesson)
    return (
      <EmptyState
        title="Lesson not found"
        description="This lesson is not available in your current roadmap."
        actionLabel="Try again"
        onAction={() => refetch()}
      />
    );

  const isCompleted = Boolean(data?.isCompleted);
  const mentorLink = `/mentor?lessonId=${lesson._id}`;
  const sendLessonPrompt = (promptType) =>
    navigate(
      `/mentor?lessonId=${lesson._id}&promptType=${promptType}&autoSend=true`,
    );

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow={
          lesson.topic?.title
            ? `Lesson · ${lesson.topic.title}`
            : "Roadmap lesson"
        }
        eyebrowIcon={BookOpenText}
        title={lesson.title}
        description={lesson.summary || lesson.description}
        actions={
          <>
            <Link
              to={mentorLink}
              className="ui-button ui-button--secondary min-h-9 gap-2 px-3.5 text-xs sm:text-sm"
            >
              <MessagesSquare size={16} aria-hidden="true" />
              Ask mentor
            </Link>
            {isCompleted ? (
              <span
                className="ui-button min-h-9 border-success/20 bg-success-soft px-3.5 text-xs text-success sm:text-sm"
                aria-label="Lesson completed"
              >
                <BookOpenCheck size={16} aria-hidden="true" />
                Completed
              </span>
            ) : (
              <Button
                className="min-h-9 px-3.5 text-xs sm:text-sm"
                onClick={() => completeMutation.mutate(lesson._id)}
                isLoading={completeMutation.isPending}
                loadingLabel="Saving completion..."
              >
                <BookOpenCheck size={16} aria-hidden="true" />
                Mark complete
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {lesson.difficulty && (
          <Badge variant="neutral" className="capitalize">
            {lesson.difficulty}
          </Badge>
        )}
        {Number(lesson.estimatedMinutes) > 0 && (
          <Badge variant="neutral">{lesson.estimatedMinutes} minutes</Badge>
        )}
      </div>

      <ErrorMessage message={completeMutation.error?.message} />

      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary-soft via-violet-50 to-blue-50 shadow-sm">
        <div
          className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-white/65 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex items-start gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-surface bg-primary text-white shadow-sm"
            aria-hidden="true"
          >
            <MessagesSquare size={20} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Need help with this lesson?
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Ask for a simpler explanation, an interview-ready answer, or
              another practice question based on this topic.
            </p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => sendLessonPrompt("simple_explanation")}
          >
            Explain simply
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => sendLessonPrompt("interview_answer")}
          >
            Prepare an interview answer
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => sendLessonPrompt("practice_question")}
          >
            Create a practice question
          </Button>
        </div>
      </Card>

      <Card className="shadow-sm">
        <LessonContent lesson={lesson} />
      </Card>
    </PageShell>
  );
}
