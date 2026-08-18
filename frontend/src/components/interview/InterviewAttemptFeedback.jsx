import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
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
  onRetry
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fallback =
    attempt.feedbackMode === REVIEW_MODE.FALLBACK ||
    attempt.status === REVIEW_STATUS.UNAVAILABLE;
  const aiReviewed =
    attempt.feedbackMode === REVIEW_MODE.AI &&
    attempt.status === REVIEW_STATUS.REVIEWED;
  const strengths = attempt.aiFeedback?.strengths || [];
  const improvements = attempt.aiFeedback?.improvements || [];

  return (
    <article className="py-4 sm:py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-foreground">Attempt {attemptNumber}</p>
            {aiReviewed && typeof attempt.score === 'number' ? (
              <Badge variant="success">Mentor reviewed · {attempt.score}%</Badge>
            ) : (
              <StatusPill status={attempt.status} />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Saved {formatDate(attempt.createdAt)}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition hover:border-primary/30 hover:text-primary"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} attempt ${attemptNumber}`}
        >
          <ChevronDown
            size={18}
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {isExpanded ? (
        <div className="mt-4 border-t border-border pt-4">
          {fallback ? (
            <div className="mb-4 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                className="border-primary/20 bg-primary-soft text-primary-strong hover:bg-primary-soft/70"
                isLoading={isRetrying}
                loadingLabel="Mentor reviewing..."
                onClick={onRetry}
              >
                <Sparkles size={14} aria-hidden="true" />
                Retry Mentor Review
              </Button>
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-bold text-foreground">Your answer</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{attempt.answer}</p>
          </div>

          {fallback ? (
            <InlineAlert className="mt-4" tone="warning" title="Mentor feedback unavailable">
              Your answer is saved. Retry the review later without using another attempt.
            </InlineAlert>
          ) : null}

          {attempt.status === REVIEW_STATUS.REVIEWING ? (
            <InlineAlert className="mt-4" title="Mentor review in progress">
              Your saved answer is being reviewed. Refreshing the page will not use another attempt.
            </InlineAlert>
          ) : null}

          {attempt.aiFeedback?.summary ? (
            <div className="mt-4 border-l-2 border-primary pl-4">
              <div className="flex items-center gap-2 text-primary-strong">
                <Sparkles size={15} aria-hidden="true" />
                <h3 className="text-sm font-bold">Mentor feedback</h3>
              </div>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{attempt.aiFeedback.summary}</p>
            </div>
          ) : null}

          {strengths.length || improvements.length ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {strengths.length ? (
                <div>
                  <h3 className="text-sm font-bold text-success">What you did well</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                    {strengths.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ) : null}

              {improvements.length ? (
                <div>
                  <h3 className="text-sm font-bold text-error">What to improve</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                    {improvements.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
