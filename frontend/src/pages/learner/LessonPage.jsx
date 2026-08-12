import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpenCheck,
  BookOpenText,
  MessagesSquare,
  Sparkles,
} from "lucide-react";
import Loader from "../../components/common/Loader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import PageShell from "../../components/common/PageShell.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import LessonContent from "../../components/lesson/LessonContent.jsx";
import { lessonApi } from '../../api/lessonApi.js';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState(null);

  useEffect(() => {
    if (!lessonId) return undefined;
    let active = true;
    setIsLoading(true);
    setError(null);

    lessonApi.get(lessonId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lessonId, loadAttempt]);

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
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );

  const isCompleted = Boolean(data?.isCompleted);
  const mentorLink = `/mentor?lessonId=${lesson._id}`;
  const sendLessonPrompt = (promptType) =>
    navigate(
      `/mentor?lessonId=${lesson._id}&promptType=${promptType}&autoSend=true`,
    );

  const completeLesson = async () => {
    setIsCompleting(true);
    setCompleteError(null);
    try {
      const result = await lessonApi.complete(lesson._id);
      setData((current) => ({ ...current, isCompleted: true }));
      if (result?.nextPath) navigate(result.nextPath);
    } catch (requestError) {
      setCompleteError(requestError);
    } finally {
      setIsCompleting(false);
    }
  };

  const mentorPromptClass =
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/35 hover:text-foreground";

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
                onClick={completeLesson}
                isLoading={isCompleting}
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

      <ErrorMessage message={completeError?.message} />

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
          <button
            type="button"
            className={mentorPromptClass}
            onClick={() => sendLessonPrompt("simple_explanation")}
          >
            <Sparkles size={12} className="text-primary" aria-hidden="true" />
            Explain simply
          </button>
          <button
            type="button"
            className={mentorPromptClass}
            onClick={() => sendLessonPrompt("interview_answer")}
          >
            <Sparkles size={12} className="text-primary" aria-hidden="true" />
            Prepare an interview answer
          </button>
          <button
            type="button"
            className={mentorPromptClass}
            onClick={() => sendLessonPrompt("practice_question")}
          >
            <Sparkles size={12} className="text-primary" aria-hidden="true" />
            Create a practice question
          </button>
        </div>
      </Card>

      <Card className="shadow-sm">
        <LessonContent lesson={lesson} />
      </Card>
    </PageShell>
  );
}
