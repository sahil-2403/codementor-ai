import { REVIEW_MODE, REVIEW_STATUS } from '../../constants/domainEnums.js';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import InlineAlert from '../common/InlineAlert.jsx';
import StatusPill from '../common/StatusPill.jsx';
import { formatDate } from '../../utils/formatDate.js';

export default function InterviewAttemptFeedback({ attempt, attemptNumber, isRetrying = false, onRetry }) {
  const fallback = attempt.feedbackMode === REVIEW_MODE.FALLBACK || attempt.status === REVIEW_STATUS.UNAVAILABLE;
  const aiReviewed = attempt.feedbackMode === REVIEW_MODE.AI && attempt.status === REVIEW_STATUS.REVIEWED;
  const expectedAnswer = attempt.aiFeedback?.expectedAnswer || attempt.question?.expectedAnswer;
  const strengths = attempt.aiFeedback?.strengths || [];
  const improvements = attempt.aiFeedback?.improvements || [];

  return <article className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black text-foreground">Attempt {attemptNumber}</p>
          <StatusPill status={attempt.status} />
          {aiReviewed && typeof attempt.score === 'number' ? <Badge variant="success">Score {attempt.score}%</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Saved {formatDate(attempt.createdAt)}</p>
      </div>
      {fallback ? <Button type="button" variant="secondary" isLoading={isRetrying} loadingLabel="Retrying review..." onClick={onRetry}>Retry Gemini review</Button> : null}
    </div>

    <div className="mt-4 rounded-2xl bg-surface-secondary p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Your answer</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{attempt.answer}</p>
    </div>

    {fallback ? <InlineAlert className="mt-4" tone="warning" title="Gemini feedback unavailable">
      Your answer is safely stored. The comparison below comes from the published expected answer and does not include an AI score or new weak-topic signal.
    </InlineAlert> : null}

    {attempt.status === REVIEW_STATUS.REVIEWING ? <InlineAlert className="mt-4" title="Review in progress">
      This saved answer is already being reviewed. Refresh the page before requesting another review.
    </InlineAlert> : null}

    {attempt.aiFeedback?.summary ? <div className="mt-4 rounded-2xl bg-primary-soft p-4 text-sm leading-7 text-primary-strong">
      <p className="font-black">{aiReviewed ? 'Gemini feedback' : 'Review guidance'}</p>
      <p className="mt-1">{attempt.aiFeedback.summary}</p>
    </div> : null}

    {expectedAnswer ? <div className="mt-4 rounded-2xl border border-border p-4">
      <p className="font-black text-foreground">Expected answer</p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{expectedAnswer}</p>
    </div> : null}

    {strengths.length || improvements.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">
      {strengths.length ? <div className="rounded-2xl bg-success-soft p-4 text-sm text-success">
        <p className="font-black">Strengths</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">{strengths.map((item) => <li key={item}>{item}</li>)}</ul>
      </div> : null}
      {improvements.length ? <div className="rounded-2xl bg-error-soft p-4 text-sm text-error">
        <p className="font-black">Improvements</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">{improvements.map((item) => <li key={item}>{item}</li>)}</ul>
      </div> : null}
    </div> : null}
  </article>;
}
