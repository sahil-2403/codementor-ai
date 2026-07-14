import { Link, useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import LessonContent from '../../components/lesson/LessonContent.jsx';
import { useCompleteLesson, useLesson } from '../../queries/lessonQueries.js';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useLesson(lessonId);
  const completeMutation = useCompleteLesson();
  if (isLoading) return <Loader label="Loading lesson..." />;
  const lesson = data?.lesson;
  const isCompleted = Boolean(data?.isCompleted);
  const mentorLink = `/mentor?lessonId=${lesson?._id}`;
  const sendLessonPrompt = (promptType) => navigate(`/mentor?lessonId=${lesson?._id}&promptType=${promptType}&autoSend=true`);

  return <div className="space-y-6">
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div><Badge>{lesson?.difficulty}</Badge><h1 className="mt-3 text-4xl font-black">{lesson?.title}</h1><p className="mt-2 text-slate-600">Topic: {lesson?.topic?.title} · {lesson?.estimatedMinutes} min</p></div>
        <div className="flex gap-2"><Link to={mentorLink}><Button variant="secondary">Ask AI</Button></Link>{isCompleted ? <Button disabled>Completed</Button> : <Button onClick={() => completeMutation.mutate(lesson._id)} disabled={completeMutation.isPending}>{completeMutation.isPending ? 'Saving...' : 'Mark complete'}</Button>}</div>
      </div>
    </Card>

    <Card>
      <h2 className="text-lg font-black">AI help for this lesson</h2>
      <p className="mt-1 text-sm text-slate-600">Open the mentor with this lesson as context. The answer will use your weak topics, recent quiz mistakes, and related lesson content.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => sendLessonPrompt('simple_explanation')}>Explain simply</Button>
        <Button type="button" variant="secondary" onClick={() => sendLessonPrompt('interview_answer')}>Give interview answer</Button>
        <Button type="button" variant="secondary" onClick={() => sendLessonPrompt('practice_question')}>Create practice question</Button>
      </div>
    </Card>

    {lesson && <Card><LessonContent lesson={lesson} /></Card>}
  </div>;
}
