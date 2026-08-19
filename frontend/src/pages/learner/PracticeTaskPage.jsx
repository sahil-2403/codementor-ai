import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import LevelBadge from '../../components/common/LevelBadge.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PracticeAttemptHistory from '../../components/practice/PracticeAttemptHistory.jsx';
import PracticeSubmissionForm from '../../components/practice/PracticeSubmissionForm.jsx';
import PracticeTaskRequirements from '../../components/practice/PracticeTaskRequirements.jsx';
import { practiceApi } from '../../api/practiceApi.js';
import { practiceSubmissionSchema } from '../../validations/practice.schema.js';
import notify from '../../utils/notify.js';

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

  const toggleAnswer = (submissionId) => {
    setVisibleSubmissionId((current) => current === submissionId ? null : submissionId);
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
        {Number(task.estimatedMinutes) > 0 ? (
          <span className="text-xs font-semibold text-muted-foreground">About {task.estimatedMinutes} minutes</span>
        ) : null}
        <Badge variant={canSubmit ? 'info' : 'warning'}>Attempts {attemptsUsed}/{maxAttempts}</Badge>
      </div>

      {task.isLocked ? (
        <InlineAlert tone="warning" title="Task locked">
          {task.lockedReason || 'Complete the required learning steps before opening this practice task.'}
        </InlineAlert>
      ) : null}

      <PracticeTaskRequirements
        task={task}
        showSolution={showSolution}
        onToggleSolution={() => setShowSolution((value) => !value)}
      />

      <PracticeSubmissionForm
        maxAttempts={maxAttempts}
        canSubmit={canSubmit}
        isLocked={task.isLocked}
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit(submit)}
      />

      <PracticeAttemptHistory
        submissions={submissions}
        reviewingId={reviewingId}
        visibleSubmissionId={visibleSubmissionId}
        expandedSubmissionIds={expandedSubmissionIds}
        onToggleSubmission={toggleSubmission}
        onToggleAnswer={toggleAnswer}
        onReview={review}
      />
    </PageShell>
  );
}
