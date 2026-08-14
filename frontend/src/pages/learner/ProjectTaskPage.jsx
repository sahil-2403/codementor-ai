import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileText,
  FolderCode,
} from "lucide-react";
import Loader from "../../components/common/Loader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import InlineAlert from "../../components/common/InlineAlert.jsx";
import PageShell from "../../components/common/PageShell.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import FormTextarea from "../../components/form/FormTextarea.jsx";
import { projectApi } from '../../api/projectApi.js';
import { projectSubmissionSchema } from "../../validations/project.schema.js";
import { formatDate } from "../../utils/formatDate.js";
import ProjectSubmissionFeedback from "../../components/project/ProjectSubmissionFeedback.jsx";

const isFallbackReview = (submission) =>
  submission.reviewMode === "fallback" ||
  submission.status === "review_unavailable";

const isAiReview = (submission) =>
  submission.reviewMode === "ai" && submission.status === "reviewed";

export default function ProjectTaskPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [reviewError, setReviewError] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [visibleSubmissionId, setVisibleSubmissionId] = useState(null);
  const [expandedSubmissionIds, setExpandedSubmissionIds] = useState(
    () => new Set(),
  );
  const [showSolution, setShowSolution] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(projectSubmissionSchema),
    defaultValues: { submittedCode: "", submittedExplanation: "" },
  });

  useEffect(() => {
    if (!taskId) return undefined;
    let active = true;
    setLoadError(null);

    projectApi.task(taskId)
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

  if (isLoading) return <Loader label="Loading project task..." />;

  if (loadError) {
    return (
      <EmptyState
        title="Project task is unavailable"
        description={loadError.message}
        actionLabel="Back to projects"
        onAction={() => navigate("/projects")}
      />
    );
  }

  const task = taskData?.task;
  if (!task) {
    return (
      <EmptyState
        title="Project task not found"
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
      await projectApi.submit({ projectTaskId: taskId, ...values });
      reset();
      setLoadAttempt((value) => value + 1);
    } catch (err) {
      setError("root", {
        message: err?.message || "Could not save your project submission.",
      });
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
    setReviewError(null);
    setExpandedSubmissionIds((current) => {
      const next = new Set(current);
      next.add(submissionId);
      return next;
    });
    setReviewingId(submissionId);

    try {
      await projectApi.review(submissionId);
      setLoadAttempt((value) => value + 1);
    } catch (requestError) {
      setReviewError(requestError);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Project task"
        eyebrowIcon={FolderCode}
        title={task.title}
        description={task.description}
        actions={
          <Link
            to="/projects"
            className="ui-button ui-button--secondary min-h-9 gap-2 px-3.5 text-xs sm:text-sm"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            All projects
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral" className="capitalize">
          {task.difficulty}
        </Badge>
        {Number(task.estimatedMinutes) > 0 && (
          <Badge variant="neutral">{task.estimatedMinutes} minutes</Badge>
        )}
        <Badge variant={canSubmit ? "info" : "warning"}>
          Attempts {attemptsUsed}/{maxAttempts}
        </Badge>
      </div>

      {task.isLocked && (
        <InlineAlert tone="warning" title="Task locked">
          {task.lockedReason ||
            "Complete the required learning steps before opening this project."}
        </InlineAlert>
      )}

      <Card className="shadow-sm">
        <h2 className="text-xl font-bold text-foreground">Task requirements</h2>

        {task.requirements?.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {task.requirements.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-3 py-2 text-sm leading-5 text-muted-foreground"
              >
                <CheckCircle2
                  className="shrink-0 text-success"
                  size={15}
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No requirements have been added for this task.
          </p>
        )}

        {task.starterHints?.length ? (
          <div className="mt-6">
            <h3 className="font-bold text-foreground">Starter hints</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              {task.starterHints.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {task.expectedOutput && (
          <div className="mt-6">
            <h3 className="font-bold text-foreground">Expected output</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {task.expectedOutput}
            </p>
          </div>
        )}

        {task.solution && (
          <div className="mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSolution((value) => !value)}
            >
              {showSolution ? "Hide suggested solution" : "View suggested solution"}
            </Button>

            {showSolution && (
              <div className="mt-4 rounded-panel border border-warning/20 bg-warning-soft p-4 text-sm leading-7 text-foreground">
                <p className="font-bold">Try the task first, then compare.</p>
                <pre className="mt-3 overflow-auto whitespace-pre-wrap font-mono text-xs leading-6">
                  {task.solution}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="shadow-sm">
        <div className="flex items-start gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-surface bg-primary-soft text-primary"
            aria-hidden="true"
          >
            <Code2 size={20} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Submit your solution
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              You can submit up to {maxAttempts} solutions. Your work is saved
              before the review begins.
            </p>
          </div>
        </div>

        <ErrorMessage message={errors.root?.message} />

        {!canSubmit && (
          <InlineAlert
            className="mt-4"
            tone="warning"
            title="Submissions closed"
          >
            {task.isLocked
              ? "Unlock this project before submitting."
              : `You have used all ${maxAttempts} attempts for this task.`}
          </InlineAlert>
        )}

        <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
          <FormTextarea
            label="Code or pseudocode"
            className="min-h-52 font-mono text-xs"
            placeholder="Paste your code or pseudocode here..."
            registration={register("submittedCode")}
            error={errors.submittedCode?.message}
            disabled={!canSubmit}
          />
          <FormTextarea
            label="Approach and tradeoffs"
            className="min-h-32"
            placeholder="Explain your approach, edge cases, and decisions..."
            registration={register("submittedExplanation")}
            error={errors.submittedExplanation?.message}
            disabled={!canSubmit}
          />
          <Button
            type="submit"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingLabel="Saving submission..."
          >
            Save submission
          </Button>
        </form>
      </Card>

      <Card className="shadow-sm">
        <div>
          <p className="ui-eyebrow">Attempt history</p>
          <h2 className="ui-section-title">Your submissions and feedback</h2>
          <p className="ui-section-description">
            If detailed feedback was unavailable earlier, you can retry the
            review without using another attempt.
          </p>
        </div>

        <ErrorMessage message={reviewError?.message} />

        <div className="mt-5 space-y-4">
          {submissions.length ? (
            submissions.map((submission) => {
              const fallback = isFallbackReview(submission);
              const aiReviewed = isAiReview(submission);
              const canReview = ["submitted", "review_unavailable"].includes(
                submission.status,
              );
              const isReviewing =
                reviewingId === submission._id ||
                submission.status === "reviewing";
              const isExpanded = expandedSubmissionIds.has(submission._id);

              return (
                <article
                  key={submission._id}
                  className="rounded-panel border border-border bg-surface-secondary p-4 transition-colors sm:p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="neutral">
                          Attempt {submission.attemptNumber || "?"}
                        </Badge>
                        {!aiReviewed && (
                          <StatusPill status={submission.status} />
                        )}
                        {aiReviewed && (
                          <Badge variant="success">
                            Reviewed · {submission.score}%
                          </Badge>
                        )}
                        {fallback && (
                          <Badge variant="warning">Score unavailable</Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Saved {formatDate(submission.createdAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSubmission(submission._id)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} attempt ${submission.attemptNumber || "details"}`}
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setVisibleSubmissionId(
                              visibleSubmissionId === submission._id
                                ? null
                                : submission._id,
                            )
                          }
                        >
                          {visibleSubmissionId === submission._id
                            ? "Hide answer"
                            : "View answer"}
                        </Button>

                        {canReview && (
                          <Button
                            type="button"
                            onClick={() => review(submission._id)}
                            isLoading={isReviewing}
                            loadingLabel="Requesting review..."
                          >
                            {fallback ? "Retry review" : "Request review"}
                          </Button>
                        )}
                      </div>

                      {isReviewing && (
                        <InlineAlert className="mt-4" title="Review in progress">
                          Your saved submission is being reviewed. Refreshing the
                          page will not use another attempt.
                        </InlineAlert>
                      )}

                      {visibleSubmissionId === submission._id && (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-surface bg-slate-950 p-4 text-slate-100">
                            <h3 className="flex items-center gap-2 text-sm font-bold">
                              <Code2 size={16} aria-hidden="true" />
                              Submitted code
                            </h3>
                            <pre className="mt-3 overflow-auto whitespace-pre-wrap font-mono text-xs leading-6">
                              {submission.submittedCode || "No code submitted."}
                            </pre>
                          </div>

                          <div className="rounded-surface border border-border bg-surface p-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                              <FileText size={16} aria-hidden="true" />
                              Submitted explanation
                            </h3>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                              {submission.submittedExplanation ||
                                "No explanation submitted."}
                            </p>
                          </div>
                        </div>
                      )}

                      <ProjectSubmissionFeedback submission={submission} />
                    </div>
                  )}
                </article>
              );
            })
          ) : (
            <EmptyState
              title="No submissions yet"
              description="Save your first solution when you are ready. Your work will remain available even if detailed feedback is temporarily unavailable."
            />
          )}
        </div>
      </Card>
    </PageShell>
  );
}
