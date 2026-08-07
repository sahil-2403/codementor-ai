import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Sparkles,
  XCircle
} from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import QuizResultSummary from '../../components/quiz/QuizResultSummary.jsx';
import { useExplainQuizAttempt, useQuizAttempt } from '../../queries/quizQueries.js';

const sourceLabel = (source) =>
  source?.title ||
  source?.name ||
  (typeof source === 'string' ? source : 'Learning source');

const cleanMarkdownText = (value = '') =>
  String(value)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|\s)\*\s+/g, '$1')
    .trim();

function InlineFormattedText({ text }) {
  const cleaned = cleanMarkdownText(text);
  const parts = cleaned.split(/(`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded bg-slate-900/7 px-1.5 py-0.5 font-mono text-[0.92em] font-semibold text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function FormattedExplanation({ text }) {
  const normalized = cleanMarkdownText(text)
    .replace(/\s+(?=\d+\.\s+[A-Z])/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 text-sm leading-7 text-foreground sm:text-base">
      {lines.map((line, index) => (
        <p key={`${line.slice(0, 40)}-${index}`}>
          <InlineFormattedText text={line} />
        </p>
      ))}
    </div>
  );
}

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    error: attemptError,
    refetch
  } = useQuizAttempt(attemptId);
  const explainMutation = useExplainQuizAttempt(attemptId);
  const [error, setError] = useState('');

  if (isLoading) return <Loader label="Loading quiz result..." />;

  if (attemptError) {
    return (
      <EmptyState
        title="Quiz result is unavailable"
        description={attemptError.message}
        actionLabel="Back to roadmap"
        onAction={() => navigate('/roadmap')}
      />
    );
  }

  const attempt = data?.attempt;

  if (!attempt) {
    return (
      <EmptyState
        title="Quiz attempt not found"
        description="This result is not available for your account."
        actionLabel="Try again"
        onAction={() => refetch()}
      />
    );
  }

  const hasExplanation = Boolean(attempt.aiExplanation?.summary);
  const aiAvailable = attempt.aiExplanation?.aiAvailable === true;

  const explainMistakes = async () => {
    try {
      setError('');
      await explainMutation.mutateAsync();
    } catch (err) {
      setError(err?.message || 'Could not prepare the explanation.');
    }
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <QuizResultSummary attempt={attempt} />
        <ErrorMessage message={error || explainMutation.error?.message} />

        <Card className="border-primary/10 bg-gradient-to-br from-surface via-surface to-primary-soft/25 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong"
                  aria-hidden="true"
                >
                  <Sparkles size={16} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
                    {hasExplanation
                      ? aiAvailable
                        ? 'AI explanation'
                        : 'Standard explanation'
                      : 'Extra explanation'}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    Understand your mistakes
                  </h2>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {hasExplanation
                  ? 'Use this explanation to understand why the missed answers were incorrect and what to revise next.'
                  : 'Request an extra explanation for the questions you answered incorrectly.'}
              </p>
            </div>

            {hasExplanation ? (
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-success/20 bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">
                <CheckCircle2 size={14} aria-hidden="true" />
                Explanation ready
              </span>
            ) : (
              <Button
                onClick={explainMistakes}
                isLoading={explainMutation.isPending}
                loadingLabel="Preparing explanation..."
                className="shrink-0 gap-2"
              >
                <Sparkles size={15} aria-hidden="true" />
                Explain mistakes
              </Button>
            )}
          </div>

          {hasExplanation ? (
            <div
              className={`mt-5 rounded-panel border p-5 sm:p-6 ${
                aiAvailable
                  ? 'border-primary/15 bg-white/65'
                  : 'border-warning/20 bg-warning-soft/70'
              }`}
            >
              {!aiAvailable && (
                <p className="mb-4 text-sm font-semibold leading-6 text-warning">
                  A personalised explanation is unavailable, so this explanation
                  uses the lesson and quiz guidance.
                </p>
              )}
              <FormattedExplanation text={attempt.aiExplanation.summary} />
            </div>
          ) : (
            <p className="mt-5 rounded-surface border border-dashed border-border bg-surface-secondary/60 p-4 text-sm leading-6 text-muted-foreground">
              Your score and answer-by-answer explanations are already available
              below. Use the extra explanation when you want more help connecting
              the mistakes to topics you should revise.
            </p>
          )}

          {attempt.aiExplanation?.sources?.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Learning context
              </span>
              {attempt.aiExplanation.sources.map((source, index) => (
                <Badge
                  key={`${sourceLabel(source)}-${index}`}
                  variant="neutral"
                >
                  {sourceLabel(source)}
                </Badge>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Question review
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              Answer review
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Compare your answer with the correct answer and read the explanation
              for each question.
            </p>
          </div>

          <ol className="mt-5 space-y-3">
            {attempt.answers?.map((answer, index) => {
              const AnswerIcon = answer.isCorrect ? CheckCircle2 : XCircle;

              return (
                <li
                  key={
                    answer._id ||
                    `${answer.question?._id || index}-${index}`
                  }
                  className={`rounded-surface border border-border border-l-4 bg-surface p-4 shadow-sm ${
                    answer.isCorrect ? 'border-l-success' : 'border-l-error'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                          answer.isCorrect
                            ? 'bg-success-soft text-success'
                            : 'bg-error-soft text-error'
                        }`}
                        aria-hidden="true"
                      >
                        <AnswerIcon size={16} />
                      </span>
                      <p className="font-semibold leading-6 text-foreground">
                        {index + 1}.{' '}
                        {answer.question?.question || 'Quiz question'}
                      </p>
                    </div>
                    <Badge variant={answer.isCorrect ? 'success' : 'danger'}>
                      {answer.isCorrect ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </div>

                  <dl className="mt-4 grid gap-4 border-t border-border pt-4 text-sm md:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Your answer
                      </dt>
                      <dd className="mt-1.5 leading-6 text-foreground">
                        {answer.selectedAnswer || 'No answer'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Correct answer
                      </dt>
                      <dd className="mt-1.5 leading-6 text-foreground">
                        {answer.correctAnswer}
                      </dd>
                    </div>
                    {answer.explanation && (
                      <div className="md:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Explanation
                        </dt>
                        <dd className="mt-1.5 leading-6 text-muted-foreground">
                          {answer.explanation}
                        </dd>
                      </div>
                    )}
                  </dl>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
            <Link
              to="/roadmap"
              className="ui-button ui-button--primary inline-flex items-center gap-2"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to roadmap
            </Link>
            <Link
              to="/progress"
              className="ui-button ui-button--secondary inline-flex items-center gap-2"
            >
              <BarChart3 size={15} aria-hidden="true" />
              View progress
            </Link>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
