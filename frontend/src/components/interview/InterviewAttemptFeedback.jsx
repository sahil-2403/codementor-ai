import { RefreshCw } from 'lucide-react';
import { REVIEW_MODE, REVIEW_STATUS } from '../../constants/domainEnums.js';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import InlineAlert from '../common/InlineAlert.jsx';
import StatusPill from '../common/StatusPill.jsx';
import { formatDate } from '../../utils/formatDate.js';

export default function InterviewAttemptFeedback({
  attempt,
  attemptNumber,
  isRetrying = false,
  onRetry,
  showExpectedAnswer = false
}) {
  const fallback =
    attempt.feedbackMode === REVIEW_MODE.FALLBACK ||
    attempt.status === REVIEW_STATUS.UNAVAILABLE;
  const aiReviewed =
    attempt.feedbackMode === REVIEW_MODE.AI &&
    attempt.status === REVIEW_STATUS.REVIEWED;
  const expectedAnswer =
    attempt.aiFeedback?.expectedAnswer || attempt.question?.expectedAnswer;
  const strengths = attempt.aiFeedback?.strengths || [];
  const improvements = attempt.aiFeedback?.improvements || [];

  return (
    <article className="rounded-panel border border-border bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-foreground">Attempt {attemptNumber}</p>
            {aiReviewed && typeof attempt.score === 'number' ? (
              <Badge variant="success">Reviewed · {attempt.score}%</Badge>
            ) : (
              <StatusPill status={attempt.status} />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved {formatDate(attempt.createdAt)}
          </p>
        </div>

        {fallback ? (
          <Button
            type="button"
            variant="secondary"
            className="min-h-9 shrink-0 gap-2 px-3 text-xs sm:text-sm"
            isLoading={isRetrying}
            loadingLabel="Retrying review..."
            onClick={onRetry}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Retry review
          </Button>
        ) : null}
      </div>

      <div className="mt-4 rounded-surface bg-surface-secondary/70 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Your answer
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">
          {attempt.answer}
        </p>
      </div>

      {fallback ? (
        <InlineAlert
          className="mt-4"
          tone="warning"
          title="Detailed feedback unavailable"
        >
          Your answer is saved. The comparison below uses the expected answer and
          does not include a score or add new practice topics.
        </InlineAlert>
      ) : null}

      {attempt.status === REVIEW_STATUS.REVIEWING ? (
        <InlineAlert className="mt-4" title="Review in progress">
          Your saved answer is being reviewed. Refresh the page before trying again.
        </InlineAlert>
      ) : null}

      {attempt.aiFeedback?.summary ? (
        <div className="mt-4 rounded-surface border border-primary/10 bg-primary-soft/60 p-4 text-sm leading-7 text-primary-strong">
          <p className="font-bold">
            {aiReviewed ? 'Personalized feedback' : 'Review guidance'}
          </p>
          <p className="mt-1">{attempt.aiFeedback.summary}</p>
        </div>
      ) : null}

      {showExpectedAnswer && expectedAnswer ? (
        <div className="mt-4 rounded-surface border border-border p-4">
          <p className="font-bold text-foreground">Expected answer</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {expectedAnswer}
          </p>
        </div>
      ) : null}

      {strengths.length || improvements.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {strengths.length ? (
            <div className="rounded-surface border border-success/15 bg-success-soft p-4 text-sm text-success">
              <p className="font-bold">What you did well</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {improvements.length ? (
            <div className="rounded-surface border border-error/15 bg-error-soft p-4 text-sm text-error">
              <p className="font-bold">What to improve</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
