import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Code2,
  Dumbbell,
  FileText,
  Sparkles
} from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import LevelBadge from '../../components/common/LevelBadge.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import FormTextarea from '../../components/form/FormTextarea.jsx';
import PracticeSubmissionFeedback from '../../components/practice/PracticeSubmissionFeedback.jsx';
import { practiceApi } from '../../api/practiceApi.js';
import { practiceSubmissionSchema } from '../../validations/practice.schema.js';
import { formatDate } from '../../utils/formatDate.js';
import notify from '../../utils/notify.js';

const isFallbackReview = (submission) =>
  submission.reviewMode === 'fallback' || submission.status === 'review_unavailable';

const isAiReview = (submission) =>
  submission.reviewMode === 'ai' && submission.status === 'reviewed';

export default function PracticeTaskPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [reviewingId, setReviewingId] = useState(null);
  const [visibleSubmissionId, setVisibleSubmissionId] = useState(null);
  const [expandedSubmissionIds, setExpandedSubmissionIds] = useState(() => new Set());
  const [showSolution, setShowSolution] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(practiceSubmissionSchema),
    defaultValues: { submittedCode: '', submittedExplanation: '' }
  });

  useEffect(() => {
    if (!taskId) return undefined;
    let active = true;
    setLoadError(null);

    practiceApi.task(taskId)
      .then((result) => {
        if (active) setTaskData(result);
      })
      .catch((requestError) => {
        if (active) setLoadError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [taskId, loadAttempt]);

  if (isLoading) return <Loader label="Loading practice task..." />;

  if (loadError) {
    return (
      <EmptyState
        title="Practice task is unavailable"
        description={loadError.message}
        actionLabel="Back to practice"
        onAction={() => navigate('/practice')}
      />
    );
  }

  const task = taskData?.task;
  if (!task) {
    return (
      <EmptyState
        title="Practice task not found"
        description="This task is not available for your account."
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }

  const submissions = taskData?.submissions || [];
  const maxAttempts = taskData?.maxAttempts || task.maxAttempts || 2;
  const attemptsUsed = taskData?.attemptsUsed ?? submissions.length;
  const canSubmit = !task.isLocked && attemptsUsed < maxAttempts;

  const submit = async (values) => {
    try {
      await practiceApi.submit({ practiceTaskId: taskId, ...values });
      reset();
      notify.success('Practice attempt saved');
      setLoadAttempt((value) => value + 1);
    } catch (error) {
      notify.error(error?.message || 'Could not save your practice attempt');
    }
  };

  const toggleSubmission = (submissionId) => {
    const isExpanded = expandedSubmissionIds.has(submissionId);
    setExpandedSubmissionIds((current) => {
      const next = new Set(current);
      if (next.has(submissionId)) next.delete(submissionId);
      else next.add(submissionId);
      return next;
    });

    if (isExpanded && visibleSubmissionId === submissionId) {
      setVisibleSubmissionId(null);
    }
  };

  const review = async (submissionId) => {
    setExpandedSubmissionIds((current) => new Set(current).add(submissionId));
    setReviewingId(submissionId);

    try {
      const result = await practiceApi.review(submissionId);
      const reviewed = result?.submission?.status === 'reviewed';
      if (reviewed) notify.success('Mentor review completed');
      else notify.warning('Mentor review is temporarily unavailable. Your attempt is saved.');
      setLoadAttempt((value) => value + 1);
    } catch (error) {
      notify.error(error?.message || 'Could not complete the mentor review');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Practice task"
        eyebrowIcon={Dumbbell}
        title={task.title}
        description={task.description}
        actions={
          <Link to="/practice" className="ui-button ui-button--secondary min-h-9 gap-2 px-3.5 text-xs sm:text-sm">
            <ArrowLeft size={16} aria-hidden="true" /> All practice
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge level={task.difficulty} />
        {Number(task.estimatedMinutes) > 0 && (
          <span className="text-xs font-semibold text-muted-foreground">About {task.estimatedMinutes} minutes</span>
        )}
        <Badge variant={canSubmit ? 'info' : 'warning'}>Attempts {attemptsUsed}/{maxAttempts}</Badge>
      </div>

      {task.isLocked && (
        <InlineAlert tone="warning" title="Task locked">
          {task.lockedReason || 'Complete the required learning steps before opening this practice task.'}
        </InlineAlert>
      )}

      <section className="border-b border-border pb-5">
        <h2 className="text-lg font-bold text-foreground">Task requirements</h2>

        {task.requirements?.length ? (
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            {task.requirements.map((item) => (
              <li key={item} className="flex gap-2.5">
                <CheckCircle2 className="mt-1 shrink-0 text-success" size={15} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No requirements have been added for this task.</p>
        )}

        {task.starterHints?.length ? (
          <div className="mt-5">
            <h3 className="text-sm font-bold text-foreground">Starter hints</h3>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
              {task.starterHints.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        ) : null}

        {task.expectedOutput && (
          <div className="mt-5">
            <h3 className="text-sm font-bold text-foreground">Expected output</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{task.expectedOutput}</p>
          </div>
        )}

        {task.solution && (
          <div className="mt-5">
            <Button type="button" variant="secondary" onClick={() => setShowSolution((value) => !value)}>
              {showSolution ? 'Hide suggested solution' : 'View suggested solution'}
            </Button>
            {showSolution && (
              <div className="mt-3 border-l-2 border-warning pl-4 text-sm leading-7 text-foreground">
                <p className="font-bold">Try the task first, then compare.</p>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono text-xs leading-6">{task.solution}</pre>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-surface border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-surface-secondary text-muted-foreground" aria-hidden="true">
            <Code2 size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">Submit your solution</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Save up to {maxAttempts} attempts. Mentor review is requested separately from your saved attempt.</p>
          </div>
        </div>

        {!canSubmit && (
          <InlineAlert className="mt-4" tone="warning" title="Attempts closed">
            {task.isLocked ? 'Unlock this practice task before submitting.' : `You have used all ${maxAttempts} attempts for this task.`}
          </InlineAlert>
        )}

        <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
          <FormTextarea
            label="Code or pseudocode"
            className="min-h-52 font-mono text-xs"
            placeholder="Paste your code or pseudocode here..."
            registration={register('submittedCode')}
            error={errors.submittedCode?.message}
            disabled={!canSubmit}
          />
          <FormTextarea
            label="Approach and tradeoffs"
            className="min-h-32"
            placeholder="Explain your approach, edge cases, and decisions..."
            registration={register('submittedExplanation')}
            error={errors.submittedExplanation?.message}
            disabled={!canSubmit}
          />
          <Button type="submit" disabled={!canSubmit} isLoading={isSubmitting} loadingLabel="Saving attempt...">
            Save attempt
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-bold text-foreground">Attempt history</h2>
        <p className="mt-1 text-sm text-muted-foreground">Open an attempt to view your answer or ask the AI mentor for feedback.</p>

        {submissions.length ? (
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-surface border border-border bg-surface">
            {submissions.map((submission) => {
              const fallback = isFallbackReview(submission);
              const aiReviewed = isAiReview(submission);
              const canReview = ['submitted', 'review_unavailable'].includes(submission.status);
              const isReviewing = reviewingId === submission._id || submission.status === 'reviewing';
              const isExpanded = expandedSubmissionIds.has(submission._id);

              return (
                <article key={submission._id} className="p-4 sm:p-5">
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
                      onClick={() => toggleSubmission(submission._id)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} attempt ${submission.attemptNumber || 'details'}`}
                    >
                      <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setVisibleSubmissionId(visibleSubmissionId === submission._id ? null : submission._id)}
                        >
                          {visibleSubmissionId === submission._id ? 'Hide answer' : 'View answer'}
                        </Button>

                        {canReview && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="border-primary/20 bg-primary-soft text-primary-strong hover:bg-primary-soft/70"
                            onClick={() => review(submission._id)}
                            isLoading={isReviewing}
                            loadingLabel="Mentor reviewing..."
                          >
                            <Sparkles size={15} aria-hidden="true" />
                            {fallback ? 'Retry Mentor Review' : 'Mentor Review'}
                          </Button>
                        )}
                      </div>

                      {isReviewing && (
                        <InlineAlert className="mt-4" title="Mentor review in progress">
                          Your saved attempt is being reviewed. Refreshing the page will not use another attempt.
                        </InlineAlert>
                      )}

                      {visibleSubmissionId === submission._id && (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-surface bg-slate-950 p-4 text-slate-100">
                            <h3 className="flex items-center gap-2 text-sm font-bold">
                              <Code2 size={16} aria-hidden="true" /> Submitted code
                            </h3>
                            <pre className="mt-3 overflow-auto whitespace-pre-wrap font-mono text-xs leading-6">{submission.submittedCode || 'No code submitted.'}</pre>
                          </div>
                          <div className="border-l-2 border-border pl-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                              <FileText size={16} aria-hidden="true" /> Submitted explanation
                            </h3>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{submission.submittedExplanation || 'No explanation submitted.'}</p>
                          </div>
                        </div>
                      )}

                      <PracticeSubmissionFeedback submission={submission} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState title="No attempts yet" description="Save your first solution when you are ready." />
          </div>
        )}
      </section>
    </PageShell>
  );
}
