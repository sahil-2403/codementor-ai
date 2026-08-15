import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Code2, Dumbbell, LockKeyhole } from "lucide-react";
import Loader from "../../components/common/Loader.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import PageShell from "../../components/common/PageShell.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { practiceApi } from '../../api/practiceApi.js';

const reviewLabel = (submission) => {
  if (!submission) return null;
  if (submission.reviewMode === "ai" && submission.status === "reviewed") {
    return { label: "Review complete", variant: "success" };
  }
  if (
    submission.reviewMode === "fallback" ||
    submission.status === "review_unavailable"
  ) {
    return { label: "Detailed review unavailable", variant: "warning" };
  }
  if (submission.status === "reviewing") {
    return { label: "Reviewing", variant: "info" };
  }
  return { label: "Attempt saved", variant: "neutral" };
};

export default function PracticePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    practiceApi.tasks()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  if (isLoading) return <Loader label="Loading practice tasks..." />;
  if (error) {
    return (
      <EmptyState
        title="Practice is unavailable"
        description={error.message}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }

  const tasks = data?.tasks || [];
  const grouped = tasks.reduce((groups, task) => {
    const key = task.moduleTitle || "Practice tasks";
    groups[key] = [...(groups[key] || []), task];
    return groups;
  }, {});

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Coding practice"
        eyebrowIcon={Dumbbell}
        title="Practice"
        description="Apply what you learn with focused coding tasks, save your attempts, and review available feedback."
      />

      {!tasks.length ? (
        <EmptyState
          title="No practice tasks yet"
          description="Practice tasks will appear here when they are available for your current course."
        />
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([moduleTitle, moduleTasks]) => {
            const sectionId = `practice-${moduleTitle.replaceAll(" ", "-").toLowerCase()}`;

            return (
              <section key={moduleTitle} aria-labelledby={sectionId}>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 id={sectionId} className="ui-section-title">
                      {moduleTitle}
                    </h2>
                  </div>
                  <Badge variant="neutral">
                    {moduleTasks.length}
                    {"  "}
                    {moduleTasks.length === 1 ? "task" : "tasks"}
                  </Badge>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {moduleTasks.map((task) => {
                    const review = reviewLabel(task.latestSubmission);

                    return (
                      <Card
                        key={task._id}
                        className={
                          task.isLocked
                            ? "opacity-80 shadow-sm"
                            : "shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft"
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="neutral" className="capitalize">
                                {task.difficulty}
                              </Badge>
                              {review && (
                                <Badge variant={review.variant}>
                                  {review.label}
                                </Badge>
                              )}
                            </div>

                            <h3 className="mt-3 text-xl font-bold text-foreground">
                              {task.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {task.description}
                            </p>
                          </div>

                          {typeof task.bestScore === "number" && (
                            <Badge
                              variant="success"
                              className="flex flex-col min-w-fit"
                            >
                              Best {task.bestScore}%
                            </Badge>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(task.tags || []).slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="neutral">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-sm font-semibold text-muted-foreground">
                            {Number(task.estimatedMinutes) > 0
                              ? `${task.estimatedMinutes} min · `
                              : ""}
                            Attempts {task.attemptsUsed || 0}/
                            {task.maxAttempts || 2}
                          </span>

                          {task.isLocked ? (
                            <span
                              className="ui-button ui-button--secondary min-h-9 cursor-not-allowed gap-2 px-3.5 text-xs sm:text-sm"
                              aria-disabled="true"
                            >
                              <LockKeyhole size={16} aria-hidden="true" />
                              Locked
                            </span>
                          ) : (
                            <Link
                              to={`/practice/${task._id}`}
                              className="ui-button ui-button--primary min-h-9 gap-2 px-3.5 text-xs sm:text-sm"
                            >
                              <Code2 size={16} aria-hidden="true" />
                              Start practice
                            </Link>
                          )}
                        </div>

                        {task.isLocked && (
                          <p className="mt-3 rounded-surface bg-surface-secondary p-3 text-sm leading-6 text-muted-foreground">
                            {task.lockedReason}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
