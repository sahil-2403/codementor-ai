import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Badge from '../../components/common/Badge.jsx';
import QuizQuestionCard from '../../components/quiz/QuizQuestionCard.jsx';
import QuizProgress from '../../components/quiz/QuizProgress.jsx';
import { useModuleQuiz, useSubmitQuiz } from '../../queries/quizQueries.js';

export default function QuizPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error: quizError, refetch } = useModuleQuiz(moduleId);
  const submitQuiz = useSubmitQuiz();
  const draftKey = useMemo(() => data?.quiz?.courseId && moduleId ? `quiz-draft:${data.quiz.courseId}:${moduleId}` : '', [data?.quiz?.courseId, moduleId]);
  const [answers, setAnswers] = useState({});
  const [draftReady, setDraftReady] = useState(false);
  const [error, setError] = useState('');

  const quiz = data?.quiz;
  const questions = quiz?.questions || [];
  const questionSignature = questions.map((question) => question._id).join(':');
  const answeredCount = questions.filter((question) => answers[question._id]).length;

  useEffect(() => {
    setDraftReady(false);
    if (!draftKey || !questions.length) return;
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || '{}');
      const questionIds = new Set(questions.map((question) => question._id));
      setAnswers(saved && typeof saved === 'object' ? Object.fromEntries(Object.entries(saved).filter(([questionId]) => questionIds.has(questionId))) : {});
    } catch {
      setAnswers({});
    } finally {
      setDraftReady(true);
    }
  }, [draftKey, questionSignature]);

  useEffect(() => {
    if (!draftKey || !draftReady) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    } catch {
      // Draft persistence is optional; quiz submission still works without local storage.
    }
  }, [draftKey, draftReady, answers]);

  if (isLoading) return <Loader label="Loading quiz..." />;
  if (quizError) return <EmptyState title="Quiz is unavailable" description={quizError.message} actionLabel="Back to roadmap" onAction={() => navigate('/roadmap')} />;
  if (!quiz || !questions.length) return <EmptyState title="No published quiz questions" description="This module does not currently have an available quiz question set." actionLabel="Try again" onAction={() => refetch()} />;

  const submit = async () => {
    try {
      setError('');
      const payload = questions.map((question) => ({ questionId: question._id, selectedAnswer: answers[question._id] || '' })).filter((answer) => answer.selectedAnswer);
      if (payload.length !== questions.length) throw new Error('Please answer every question before submitting.');
      const result = await submitQuiz.mutateAsync({ moduleId, answers: payload });
      if (draftKey) {
        try { localStorage.removeItem(draftKey); } catch { /* Draft cleanup is optional after a successful submission. */ }
      }
      navigate(`/quizzes/result/${result.attempt._id}`);
    } catch (err) {
      setError(err?.message || 'Could not submit the quiz.');
    }
  };

  return <div className="mx-auto max-w-4xl space-y-5">
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><Badge variant="neutral">Deterministic scoring</Badge><h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">{quiz.moduleTitle || 'Module quiz'}</h1><p className="mt-2 leading-7 text-muted-foreground">Every published question is required. Stored correct answers determine the score and weak-topic signals.</p></div><Button type="button" variant="ghost" onClick={() => navigate('/roadmap')}>Exit quiz</Button></div>
      <div className="mt-5"><QuizProgress current={answeredCount} total={questions.length} /></div>
      {draftKey && <p className="mt-3 text-xs text-muted-foreground">Answers are saved locally in this browser until submission.</p>}
    </Card>

    <ErrorMessage message={error || submitQuiz.error?.message} />
    {questions.map((question, index) => <QuizQuestionCard key={question._id} question={question} index={index} value={answers[question._id]} onChange={(value) => setAnswers((current) => ({ ...current, [question._id]: value }))} />)}
    <Card className="sticky bottom-4 z-10 flex flex-col gap-4 bg-surface/95 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-semibold text-foreground">{answeredCount}/{questions.length} questions answered</p><p className="mt-1 text-sm text-muted-foreground">Review selections before submitting; the backend requires the exact published question set.</p></div>
      <Button className="shrink-0 px-6" onClick={submit} disabled={answeredCount !== questions.length} isLoading={submitQuiz.isPending} loadingLabel="Submitting quiz...">Submit quiz</Button>
    </Card>
  </div>;
}
