import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import QuizResultSummary from '../../components/quiz/QuizResultSummary.jsx';
import { useExplainQuizAttempt, useQuizAttempt } from '../../queries/quizQueries.js';

const sourceLabel = (source) => source?.title || source?.name || (typeof source === 'string' ? source : 'Learning source');

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error: attemptError, refetch } = useQuizAttempt(attemptId);
  const explainMutation = useExplainQuizAttempt(attemptId);
  const [error, setError] = useState('');

  if (isLoading) return <Loader label="Loading quiz result..." />;
  if (attemptError) return <EmptyState title="Quiz result is unavailable" description={attemptError.message} actionLabel="Back to roadmap" onAction={() => navigate('/roadmap')} />;

  const attempt = data?.attempt;
  if (!attempt) return <EmptyState title="Quiz attempt not found" description="This result was not returned for your account." actionLabel="Try again" onAction={() => refetch()} />;

  const hasExplanation = Boolean(attempt.aiExplanation?.summary);
  const aiAvailable = attempt.aiExplanation?.aiAvailable === true;

  const explainMistakes = async () => {
    try {
      setError('');
      await explainMutation.mutateAsync();
    } catch (err) {
      setError(err?.message || 'Could not prepare the mistake explanation.');
    }
  };

  return <PageShell>
    <QuizResultSummary attempt={attempt} />
    <ErrorMessage message={error || explainMutation.error?.message} />

    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div><div className="flex flex-wrap gap-2"><Bade variant={hasExplanation ? (aiAvailable ? 'info' : 'warning') : 'neutral'}>{hasExplanation ? (aiAvailable ? 'Gemini explanation' : 'Stored fallback explanation') : 'Optional explanation'}</Badge></div><h2 className="mt-3 text-xl font-bold text-foreground">Mistake explanation</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Gemini can explain wrong answers using trusted context. If it is unavailable, the backend stores a fallback built from quiz and lesson explanations.</p></div>
        <Button onClick={explainMistakes} disabled={hasExplanation} isLoading={explainMutation.isPending} loadingLabel="Preparing explanation...">{hasExplanation ? 'Explanation saved' : 'Explain mistakes'}</Button>
      </div>

      {hasExplanation ? <div className={`mt-5 rounded-panel border p-5 ${aiAvailable ? 'border-primary/20 bg-primary-soft' : 'border-warning/20 bg-warning-soft'}`}>
        {!aiAvailable && <p className="mb-3 font-semibold text-warning">Gemini was unavailable. This is the stored fallback explanation.</p>}
        <p className="whitespace-pre-line leading-7 text-foreground">{attempt.aiExplaination.summary}</p>
      </div> : <p className="mt-5 rounded-surface bg-surface-secondary p-4 text-sm leading-6 text-muted-foreground">No optional mistake explanation has been requested yet. The deterministic score and stored per-question explanations are already available below.</p>}

      {attempt.aiExplanation?.sources?.length ? <div className="mt-4 flex flex-wrap gap-2">{attempt.aiExplanation.sources.map((source, index) => <Badge key={`${sourceLabel(source)}-${index}`} variant="neutral">{sourceLabel(source)}</Badge>)}</div> : null}
    </Card>

    <Card>
      <h2 className="text-xl font-bold text-foreground">Answer review</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Correct answers and explanations come from the published quiz question records.</p>
      <ol className="mt-5 space-y-4">{attempt.answers?.map((answer, index) => <li key={answer._id || `${answer.question?._id || index}-${index}`} className={`rounded-surface border p-4 ${answer.isCorrect ? 'border-success/20 bg-success-soft' : 'border-error/20 bg-error-soft'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-foreground">{index + 1}. {answer.question?.question || 'Quiz question'}</p><Badge variant={answer.isCorrect ? 'success' : 'danger'}>{answer.isCorrect ? 'Correct' : 'Incorrect'}</Badge></div>
        <dl className="mt-3 grid gap-2 text-sm">
          <div><dt className="font-semibold text-foreground">Your answer</dt><dd className="mt-1 text-muted-foreground">{answer.selectedAnswer || 'No answer'}</dd></div>
          <div><dt className="font-semibold text-foreground">Correct answer</dt><dd className="mt-1 text-muted-foreground">{answer.correctAnswer}</dd></div>
          {answer.explanation && <div><dt className="font-semibold text-foreground">Explanation</dt><dd className="mt-1 leading-6 text-muted-foreground">{answer.explanation}</dd></div>}
        </dl>
      </li>)}</ol>
      <div className="mt-5 flex flex-wrap gap-3"><Link to="/roadmap" className="ui-button ui-button--primary">Back to roadmap</Link><Link to="/progress" className="ui-button ui-button--secondary">View progress</Link></div>
    </Card>
  </PageShell>;
}
