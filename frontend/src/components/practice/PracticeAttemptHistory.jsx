import { ChevronDown, Code2, FileText, Sparkles } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import InlineAlert from '../common/InlineAlert.jsx';
import SectionHeader from '../common/SectionHeader.jsx';
import StatusPill from '../common/StatusPill.jsx';
import PracticeSubmissionFeedback from './PracticeSubmissionFeedback.jsx';
import { formatDate } from '../../utils/formatDate.js';

const isFallbackReview = (submission) =>
  submission.reviewMode === 'fallback' || submission.status === 'review_unavailable';

const isAiReview = (submission) =>
  submission.reviewMode === 'ai' && submission.status === 'reviewed';

export default function PracticeAttemptHistory({
  submissions,
  reviewingId,
  visibleSubmissionId,
  expandedSubmissionIds,
  onToggleSubmission,
  onToggleAnswer,
  onReview
}) {
  return (
    <Card variant="compact">
      <SectionHeader
        title="Attempt history"
        description="Open an attempt to view your answer or ask the AI mentor for feedback."
      />

      {submissions.length ? (
        <div className="mt-3 divide-y divide-border">
          {submissions.map((submission) => {
            const fallback = isFallbackReview(submission);
            const aiReviewed = isAiReview(submission);
            const canReview = ['submitted', 'review_unavailable'].includes(submission.status);
            const isReviewing = reviewingId === submission._id || submission.status === 'reviewing';
            const isExpanded = expandedSubmissionIds.has(submission._id);
            const answerVisible = visibleSubmissionId === submission._id;

            return (
              <article key={submission._id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">Attempt {submission.attemptNumber || '?'}</Badge>
                      {!aiReviewed && <StatusPill status={submission.status} />}
                      {aiReviewed && <Badge variant="success">Mentor reviewed · {submission.score}%</Badge>}
                      {fallback && <Badge variant="warning">Score unavailable</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Saved {formatDate(submission.createdAt)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleSubmission(submission._id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} attempt ${submission.attemptNumber || 'details'}`}
                  >
                    <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                </div>

                {isExpanded ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onToggleAnswer(submission._id)}
                      >
                        {answerVisible ? 'Hide answer' : 'View answer'}
                      </Button>

                      {canReview ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="border-primary/20 bg-primary-soft text-primary-strong hover:bg-primary-soft/70"
                          onClick={() => onReview(submission._id)}
                          isLoading={isReviewing}
                          loadingLabel="Mentor reviewing..."
                        >
                          <Sparkles size={15} aria-hidden="true" />
                          {fallback ? 'Retry Mentor Review' : 'Mentor Review'}
                        </Button>
                      ) : null}
                    </div>

                    {isReviewing ? (
                      <InlineAlert className="mt-4" title="Mentor review in progress">
                        Your saved attempt is being reviewed. Refreshing the page will not use another attempt.
                      </InlineAlert>
                    ) : null}

                    {answerVisible ? (
                      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
                        <div className="min-w-0 rounded-surface bg-slate-950 p-4 text-slate-100">
                          <h3 className="flex items-center gap-2 text-sm font-bold">
                            <Code2 size={16} aria-hidden="true" /> Submitted code
                          </h3>
                          <pre className="mt-3 max-w-full overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6">{submission.submittedCode || 'No code submitted.'}</pre>
                        </div>
                        <div className="min-w-0 border-l-2 border-border pl-4">
                          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <FileText size={16} aria-hidden="true" /> Submitted explanation
                          </h3>
                          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{submission.submittedExplanation || 'No explanation submitted.'}</p>
                        </div>
                      </div>
                    ) : null}

                    <PracticeSubmissionFeedback submission={submission} />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-3">
          <EmptyState title="No attempts yet" description="Save your first solution when you are ready." />
        </div>
      )}
    </Card>
  );
}
