import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import QuizQuestionCard from '../../components/quiz/QuizQuestionCard.jsx';
import QuizProgress from '../../components/quiz/QuizProgress.jsx';
import { useModuleQuiz, useSubmitQuiz } from '../../queries/quizQueries.js';

export default function QuizPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useModuleQuiz(moduleId);
  const submitQuiz = useSubmitQuiz();
  const draftKey = useMemo(() => data?.quiz?.courseId && moduleId ? `quiz-draft:${data.quiz.courseId}:${moduleId}` : '', [data?.quiz?.courseId, moduleId]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || '{}');
      if (saved && typeof saved === 'object') setAnswers(saved);
    } catch {}
  }, [draftKey]);

  useEffect(() => {
    if (draftKey) localStorage.setItem(draftKey, JSON.stringify(answers));
  }, [draftKey, answers]);

  if (isLoading) return <Loader label="Loading quiz..." />;
  const quiz = data?.quiz;
  const questions = quiz?.questions || [];

  const submit = async () => {
    try {
      setError('');
      const payload = questions.map((q) => ({ questionId: q._id, selectedAnswer: answers[q._id] || '' })).filter((a) => a.selectedAnswer);
      if (payload.length !== questions.length) throw new Error('Please answer all questions.');
      const result = await submitQuiz.mutateAsync({ moduleId, answers: payload });
      if (draftKey) localStorage.removeItem(draftKey);
      navigate(`/quizzes/result/${result.attempt._id}`);
    } catch (err) { setError(err.message); }
  };

  return <div className="mx-auto max-w-4xl space-y-5"><Card><h1 className="text-3xl font-black">{quiz?.moduleTitle || 'Module Quiz'}</h1><p className="mt-2 text-slate-600">Score updates your weak-topic analytics.</p><div className="mt-4"><QuizProgress current={Object.keys(answers).length} total={questions.length} /></div></Card><ErrorMessage message={error} />{questions.map((question, index) => <QuizQuestionCard key={question._id} question={question} index={index} value={answers[question._id]} onChange={(value) => setAnswers({ ...answers, [question._id]: value })} />)}<Button className="w-full py-4" onClick={submit} disabled={submitQuiz.isPending}>{submitQuiz.isPending ? 'Submitting...' : 'Submit quiz'}</Button></div>;
}
