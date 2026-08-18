import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BookOpenCheck,
  BookOpenText,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Button from '../../components/common/Button.jsx';
import LevelBadge from '../../components/common/LevelBadge.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LessonContent from '../../components/lesson/LessonContent.jsx';
import { lessonApi } from '../../api/lessonApi.js';
import notify from '../../utils/notify.js';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

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
  if (error) {
    return (
      <EmptyState
        title="Lesson is unavailable"
        description={error.message}
        actionLabel="Back to roadmap"
        onAction={() => navigate('/roadmap')}
      />
    );
  }

  const lesson = data?.lesson;
  if (!lesson) {
    return (
      <EmptyState
        title="Lesson not found"
        description="This lesson is not available in your current roadmap."
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }

  const isCompleted = Boolean(data?.isCompleted);
  const mentorLink = `/mentor?lessonId=${lesson._id}`;
  const sendLessonPrompt = (promptType) =>
    navigate(`/mentor?lessonId=${lesson._id}&promptType=${promptType}&autoSend=true`);

  const completeLesson = async () => {
    setIsCompleting(true);
    try {
      const result = await lessonApi.complete(lesson._id);
      setData((current) => ({ ...current, isCompleted: true }));
      notify.success('Lesson marked complete');
      if (result?.nextPath) navigate(result.nextPath);
      else if (result?.courseCompleted) navigate('/roadmap');
    } catch (requestError) {
      notify.error(requestError.message || 'Could not mark this lesson complete');
    } finally {
      setIsCompleting(false);
    }
  };

  const mentorPromptClass =
    'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/15 bg-surface px-3 py-1.5 text-xs font-semibold text-primary-strong transition hover:bg-primary-soft';

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow={lesson.topic?.title ? `Lesson · ${lesson.topic.title}` : 'Roadmap lesson'}
        eyebrowIcon={BookOpenText}
        title={lesson.title}
        description={lesson.summary || lesson.description}
        actions={
          <>
            <Link
              to={mentorLink}
              className="ui-button ui-button--secondary min-h-9 gap-2 border-primary/20 bg-primary-soft px-3.5 text-xs text-primary-strong hover:bg-primary-soft/70 sm:text-sm"
            >
              <Sparkles size={16} aria-hidden="true" />
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

      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge level={lesson.difficulty} />
        {Number(lesson.estimatedMinutes) > 0 && (
          <span className="text-xs font-semibold text-muted-foreground">
            About {lesson.estimatedMinutes} minutes
          </span>
        )}
      </div>

      <section className="rounded-surface border border-primary/20 bg-primary-soft/45 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary text-white"
            aria-hidden="true"
          >
            <Sparkles size={19} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">Ask your AI mentor</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Get a simpler explanation, prepare an interview answer, or try another practice question from this lesson.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={mentorPromptClass} onClick={() => sendLessonPrompt('simple_explanation')}>
            <Sparkles size={12} aria-hidden="true" />
            Explain simply
          </button>
          <button type="button" className={mentorPromptClass} onClick={() => sendLessonPrompt('interview_answer')}>
            <MessagesSquare size={12} aria-hidden="true" />
            Prepare interview answer
          </button>
          <button type="button" className={mentorPromptClass} onClick={() => sendLessonPrompt('practice_question')}>
            <Sparkles size={12} aria-hidden="true" />
            Create practice question
          </button>
        </div>
      </section>

      <section className="rounded-surface border border-border bg-surface p-4 sm:p-6">
        <LessonContent lesson={lesson} />
      </section>
    </PageShell>
  );
}
