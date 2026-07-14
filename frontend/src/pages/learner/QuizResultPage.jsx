import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import QuizResultSummary from '../../components/quiz/QuizResultSummary.jsx';
import { useExplainQuizAttempt, useQuizAttempt } from '../../queries/quizQueries.js';

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const { data, isLoading } = useQuizAttempt(attemptId);
  const explainMutation = useExplainQuizAttempt(attemptId);
  const [error, setError] = useState('');
  if (isLoading) return <Loader label="Loading result..." />;
  const attempt = data?.attempt;

  const hasExplanation = Boolean(attempt?.aiExplanation?.summary);
  const aiAvailable = attempt?.aiExplanation?.aiAvailable !== false;

  const explainMistakes = async () => {
    try {
      setError('');
      await explainMutation.mutateAsync();
    } catch (err) { setError(err.message); }
  };

  return <div className="space-y-5">
    <QuizResultSummary attempt={attempt} />
    <ErrorMessage message={error} />

    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black">AI mistake explanation</h2>
          <p className="mt-1 text-sm text-slate-600">Get a contextual explanation using your wrong answers, weak topics, and related lessons.</p>
        </div>
        <Button onClick={explainMistakes} disabled={explainMutation.isPending || hasExplanation}>{explainMutation.isPending ? 'Explaining...' : hasExplanation ? 'Explanation generated' : 'Explain my mistakes'}</Button>
      </div>
      {attempt?.aiExplanation?.summary ? <div className={`mt-5 rounded-3xl p-5 text-sm leading-7 whitespace-pre-line ${aiAvailable ? 'bg-cyan-50 text-slate-800' : 'bg-amber-50 text-amber-900'}`}>{!aiAvailable && <p className="mb-3 font-black">AI explanation is currently unavailable. Showing stored lesson and quiz explanations instead.</p>}{attempt.aiExplanation.summary}</div> : <p className="mt-4 text-sm text-slate-500">Click once to generate an explanation. If AI is unavailable, stored explanations will be shown.</p>}
      {attempt?.aiExplanation?.sources?.length ? <div className="mt-4 flex flex-wrap gap-2">{attempt.aiExplanation.sources.map((source, index) => <Badge key={`${source.refId || source.title}-${index}`} className="bg-cyan-100 text-cyan-700">{source.title}</Badge>)}</div> : null}
    </Card>

    <Card>
      <h2 className="text-xl font-black">Answers review</h2>
      <div className="mt-4 space-y-3">{attempt?.answers?.map((answer, index) => <div key={index} className={`rounded-2xl p-4 ${answer.isCorrect ? 'bg-emerald-50' : 'bg-rose-50'}`}>
        <p className="font-bold">{answer.question?.question}</p>
        <p className="mt-1 text-sm">Your answer: {answer.selectedAnswer || 'No answer'}</p>
        <p className="text-sm">Correct answer: {answer.correctAnswer}</p>
        <p className="mt-2 text-sm text-slate-600">{answer.explanation}</p>
      </div>)}</div>
      <Link to="/roadmap"><Button className="mt-5">Back to roadmap</Button></Link>
    </Card>
  </div>;
}
