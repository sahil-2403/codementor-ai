import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Dumbbell, LockKeyhole, SlidersHorizontal } from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import LevelBadge from '../../components/common/LevelBadge.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import { practiceApi } from '../../api/practiceApi.js';

const reviewLabel = (submission) => {
  if (!submission) return null;
  if (submission.reviewMode === 'ai' && submission.status === 'reviewed') {
    return { label: 'Mentor review complete', variant: 'success' };
  }
  if (submission.reviewMode === 'fallback' || submission.status === 'review_unavailable') {
    return { label: 'Mentor review unavailable', variant: 'warning' };
  }
  if (submission.status === 'reviewing') {
    return { label: 'Mentor reviewing', variant: 'info' };
  }
  return { label: 'Attempt saved', variant: 'neutral' };
};

const titleCase = (value = '') => value
  ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
  : '';

export default function PracticePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

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
  const moduleOptions = [...new Set(tasks.map((task) => task.moduleTitle || 'Practice tasks'))];
  const levelOptions = ['beginner', 'intermediate', 'advanced']
    .filter((level) => tasks.some((task) => task.difficulty === level));
  const filteredTasks = tasks.filter((task) => {
    const moduleTitle = task.moduleTitle || 'Practice tasks';
    const matchesModule = selectedModule === 'all' || moduleTitle === selectedModule;
    const matchesLevel = selectedLevel === 'all' || task.difficulty === selectedLevel;
    return matchesModule && matchesLevel;
  });
  const grouped = filteredTasks.reduce((groups, task) => {
    const key = task.moduleTitle || 'Practice tasks';
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
        description="Build confidence with focused coding tasks and get mentor feedback on your saved attempts."
      />

      {!tasks.length ? (
        <EmptyState
          title="No practice tasks yet"
          description="Practice tasks will appear here when they are available for your current course."
        />
      ) : (
        <>
          <Card variant="compact" aria-label="Practice filters">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-surface-secondary text-muted-foreground" aria-hidden="true">
                <SlidersHorizontal size={16} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">Choose what to practice</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Filter the task list by roadmap topic and difficulty level.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Select
                label="Topic"
                value={selectedModule}
                onChange={(event) => setSelectedModule(event.target.value)}
              >
                <option value="all">All topics</option>
                {moduleOptions.map((moduleTitle) => <option key={moduleTitle} value={moduleTitle}>{moduleTitle}</option>)}
              </Select>

              <Select
                label="Level"
                value={selectedLevel}
                onChange={(event) => setSelectedLevel(event.target.value)}
              >
                <option value="all">All available levels</option>
                {levelOptions.map((level) => <option key={level} value={level}>{titleCase(level)}</option>)}
              </Select>
            </div>
          </Card>

          {!filteredTasks.length ? (
            <EmptyState
              title="No tasks match these filters"
              description="Choose another topic or level to see available practice tasks."
            />
          ) : (
            <div className="space-y-7">
              {Object.entries(grouped).map(([moduleTitle, moduleTasks]) => (
                <section key={moduleTitle} aria-label={moduleTitle}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-foreground">{moduleTitle}</h2>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {moduleTasks.length} {moduleTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>

                  <div className="divide-y divide-border overflow-hidden rounded-surface border border-border bg-surface">
                    {moduleTasks.map((task) => {
                      const review = reviewLabel(task.latestSubmission);
                      return (
                        <article key={task._id} className={task.isLocked ? 'p-4 opacity-75 sm:p-5' : 'p-4 sm:p-5'}>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <LevelBadge level={task.difficulty} />
                                {review && <Badge variant={review.variant}>{review.label}</Badge>}
                                {typeof task.bestScore === 'number' && <Badge variant="success">Best {task.bestScore}%</Badge>}
                              </div>

                              <h3 className="mt-3 break-words text-lg font-bold text-foreground">{task.title}</h3>
                              {task.description && <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">{task.description}</p>}

                              <p className="mt-3 text-xs font-semibold text-muted-foreground">
                                {Number(task.estimatedMinutes) > 0 ? `${task.estimatedMinutes} min · ` : ''}
                                Attempts {task.attemptsUsed || 0}/{task.maxAttempts || 2}
                              </p>

                              {task.isLocked && (
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.lockedReason}</p>
                              )}
                            </div>

                            {task.isLocked ? (
                              <span className="ui-button ui-button--secondary min-h-9 shrink-0 cursor-not-allowed gap-2 px-3.5 text-xs sm:text-sm" aria-disabled="true">
                                <LockKeyhole size={15} aria-hidden="true" /> Locked
                              </span>
                            ) : (
                              <Link to={`/practice/${task._id}`} className="ui-button ui-button--primary min-h-9 shrink-0 gap-2 px-3.5 text-xs sm:text-sm">
                                <Code2 size={15} aria-hidden="true" /> Start practice
                              </Link>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
