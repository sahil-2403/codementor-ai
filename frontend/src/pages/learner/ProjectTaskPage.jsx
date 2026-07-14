import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import FormTextarea from '../../components/form/FormTextarea.jsx';
import { useProjectTask, useReviewProjectSubmission, useSubmitProjectTask } from '../../queries/projectQueries.js';
import { projectSubmissionSchema } from '../../validations/project.schema.js';

export default function ProjectTaskPage() {
  const { taskId } = useParams();
  const { data, isLoading } = useProjectTask(taskId);
  const submitMutation = useSubmitProjectTask(taskId);
  const reviewMutation = useReviewProjectSubmission(taskId);
  const [reviewingId, setReviewingId] = useState(null);
  const [visibleSubmissionId, setVisibleSubmissionId] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(projectSubmissionSchema),
    defaultValues: { submittedCode: '', submittedExplanation: '' }
  });

  if (isLoading) return <Loader label="Loading project task..." />;
  const task = data?.task;
  const submissions = data?.submissions || [];
  const maxAttempts = data?.maxAttempts || task?.maxAttempts || 2;
  const attemptsUsed = data?.attemptsUsed ?? submissions.length;
  const canSubmit = !task?.isLocked && attemptsUsed < maxAttempts;

  const submit = async (values) => {
    try {
      await submitMutation.mutateAsync({ projectTaskId: taskId, ...values });
      reset();
    } catch (err) { setError('root', { message: err.message }); }
  };

  const review = async (submissionId) => {
    try {
      setReviewingId(submissionId);
      await reviewMutation.mutateAsync(submissionId);
    } catch (err) { setError('root', { message: err.message }); }
    finally { setReviewingId(null); }
  };

  return <div className="space-y-6">
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge>{task?.difficulty}</Badge>
          <h1 className="mt-3 text-4xl font-black text-slate-950">{task?.title}</h1>
          <p className="mt-2 max-w-3xl text-slate-600">{task?.description}</p>
          <p className="mt-3 text-sm font-bold text-slate-500">Attempts used: {attemptsUsed}/{maxAttempts}</p>
        </div>
        <Link to="/projects"><Button variant="secondary">All projects</Button></Link>
      </div>
      {task?.isLocked && <InlineAlert className="mt-5" tone="warning" title="Project locked">{task.lockedReason || 'This project is locked for your current learning level.'}</InlineAlert>}
    </Card>

    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <h2 className="text-xl font-black">Task requirements</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">{task?.requirements?.map((item) => <li key={item} className="rounded-2xl bg-white/70 p-3">✓ {item}</li>)}</ul>
        <h3 className="mt-6 font-black">Starter hints</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">{task?.starterHints?.map((item) => <li key={item}>• {item}</li>)}</ul>
        <h3 className="mt-6 font-black">Expected output</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{task?.expectedOutput}</p>
        <Button type="button" variant="secondary" className="mt-5" onClick={() => setShowSolution((value) => !value)}>{showSolution ? 'Hide suggested solution' : 'View suggested solution'}</Button>
        {showSolution && <div className="mt-4 rounded-3xl bg-amber-50 p-4 text-sm leading-7 text-amber-900"><p className="font-black">Try first, then compare.</p><p className="mt-2">You learn more when you attempt the task before checking the solution.</p><div className="mt-3 whitespace-pre-line">{task?.solution || 'Suggested solution will be added by the course team soon. For now, compare your answer with the task checklist.'}</div></div>}
      </Card>

      <Card>
        <h2 className="text-xl font-black">Submit your solution</h2>
        <p className="mt-1 text-sm text-slate-600">You get {maxAttempts} submissions per project. Use them thoughtfully.</p>
        <ErrorMessage message={errors.root?.message || errors.submittedCode?.message} />
        {!canSubmit && <InlineAlert className="mt-4" tone="warning" title="Submissions closed">{task?.isLocked ? 'Unlock this project before submitting.' : 'You have used both submissions for this project.'}</InlineAlert>}
        <form onSubmit={handleSubmit(submit)} className="mt-4 space-y-4">
          <FormTextarea className="min-h-48 font-mono" placeholder="Paste your code or pseudocode here..." registration={register('submittedCode')} error={errors.submittedCode?.message} disabled={!canSubmit} />
          <FormTextarea className="min-h-28" placeholder="Explain your approach, edge cases, and decisions..." registration={register('submittedExplanation')} error={errors.submittedExplanation?.message} disabled={!canSubmit} />
          <Button disabled={!canSubmit || isSubmitting || submitMutation.isPending}>{submitMutation.isPending ? 'Submitting...' : 'Save submission'}</Button>
        </form>
      </Card>
    </div>

    <Card>
      <h2 className="text-xl font-black">Submission history</h2>
      <div className="mt-4 space-y-4">
        {submissions.length ? submissions.map((submission) => {
          const fallback = submission.reviewMode === 'fallback' || (submission.status === 'reviewed' && submission.score === null);
          return <div key={submission._id} className="rounded-3xl border border-slate-100 bg-white/70 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div><p className="font-black">{submission.status === 'reviewed' ? fallback ? 'Checklist feedback saved' : `AI reviewed · Score ${submission.score}%` : 'Submitted · Awaiting review'}</p><p className="text-sm text-slate-500">{new Date(submission.createdAt).toLocaleString()}</p></div>
              <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setVisibleSubmissionId(visibleSubmissionId === submission._id ? null : submission._id)}>View submitted answer</Button>{submission.status !== 'reviewed' && <Button variant="secondary" onClick={() => review(submission._id)} disabled={reviewingId === submission._id}>{reviewingId === submission._id ? 'Reviewing...' : 'AI review'}</Button>}</div>
            </div>
            {visibleSubmissionId === submission._id && <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm leading-7 text-slate-700 whitespace-pre-wrap">{submission.submittedCode || submission.submittedExplanation || 'No submitted text available.'}</div>}
            {submission.aiFeedback?.summary && <div className={`mt-4 rounded-3xl p-4 text-sm leading-7 ${fallback ? 'bg-amber-50 text-amber-900' : 'bg-cyan-50 text-slate-800'}`}>
              {fallback && <p className="mb-3 font-black">AI review is currently unavailable. Your submission was saved, and this checklist feedback can still help you improve.</p>}
              {!fallback && <p className="font-bold">{submission.aiFeedback.summary}</p>}
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {!fallback && <div><p className="font-black text-emerald-700">Strengths</p><ul className="mt-2 list-disc pl-5">{submission.aiFeedback.strengths?.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                <div><p className="font-black text-rose-700">Improvements</p><ul className="mt-2 list-disc pl-5">{submission.aiFeedback.improvements?.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>
            </div>}
          </div>;
        }) : <p className="text-sm text-slate-500">No submissions yet.</p>}
      </div>
    </Card>
  </div>;
}
