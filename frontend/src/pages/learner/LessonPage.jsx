import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpenCheck, MessagesSquare } from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LessonContent from '../../components/lesson/LessonContent.jsx';
import { useCompleteLesson, useLesson } from '../../queries/lessonQueries.js';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useLesson(lessonId);
  const completeMutation = useCompleteLesson();

  if (isLoading) return <Loader label="Loading lesson..." />;
  if (error) return <EmptyState title="Lesson is unavailable" description={error.message} actionLabel="Back to roadmap" onAction={() => navigate('/roadmap')} />;

  const lesson = data?.lesson;
  if (!lesson) return <EmptyState title="Lesson not found" description="This lesson was not returned for your active roadmap." actionLabel="Try again" onAction={() => refetch()} />;

  const isCompleted = Boolean(data?.isCompleted);
  const mentorLink = `/mentor?lessonId=${lesson._id}`;
  const sendLessonPrompt = (promptType) => navigate(`/mentor?lessonId=${lesson._id}&promptType=${promptType}&autoSend=true`);

  return <PageShell>
    <PageHeader
      eyebrow={lesson.topic?.title ? `Lesson · ${lesson.topic.title}` : 'Roadmap lesson'}
      title={lesson.title}
      description={lesson.summary || lesson.description}
      actions={<>
        <Link to={mentorLink} className="ui-button ui-button--secondary"><MessagesSquare size={17} aria-hidden="true" /> Ask mentor</Link>
        {isCompleted ? <span className="ui-button border-success/20 bg-success-soft text-success" aria-label="Lesson completed"><BookOpenCheck size={17} aria-hidden="true" /> Completed</span> : <Button onClick={() => completeMutation.mutate(lesson._id)} isLoading={completeMutation.isPending} loadingLabel="Saving completion...">Mark complete</Button>}
      </>}
    />

    <div className="flex flex-wrap gap-2">
      {lesson.difficulty && <Badge variant="neutral">{lesson.difficulty}</Badge>}
      {Number(lesson.estimatedMinutes) > 0 && <Badge variant="neutral">{lesson.estimatedMinutes} minutes</Badge>}
      <Badge variant={isCompleted ? 'success' : 'info'}>{isCompleted ? 'Completed' : 'Available'}</Badge>
    </div>
    <ErrorMessage message={completeMutation.error?.message} />

    <Card className="border-primary/20 bg-primary-soft">
      <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-surface bg-primary text-white" aria-hidden="true"><MessagesSquare size={20} /></span><div><h2 className="text-xl font-bold text-foreground">Mentor help for this lesson</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Open the mentor with this lesson as trusted context. When Gemini is unavailable, the mentor screen reports that state instead of fabricating an answer.</p></div></div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => sendLessonPrompt('simple_explanation')}>Explain simply</Button>
        <Button type="button" variant="secondary" onClick={() => sendLessonPrompt('interview_answer')}>Frame an interview answer</Button>
        <Button type="button" variant="secondary" onClick={() => sendLessonPrompt('practice_question')}>Create a practice question</Button>
      </div>
    </Card>

    <Card><LessonContent lesson={lesson} /></Card>
  </PageShell>;
}
