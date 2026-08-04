import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, RotateCw, XCircle } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import Loader from '../../components/common/Loader.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import { roadmapApi } from '../../api/roadmapApi.js';
import { onboardingApi } from '../../api/onboardingApi.js';
import { queryKeys } from '../../constants/queryKeys.js';

const statusMeta = {
  completed: { icon: CheckCircle2, title: 'Roadmap is ready', iconClass: 'bg-success-soft text-success' },
  failed: { icon: XCircle, title: 'Roadmap setup needs attention', iconClass: 'bg-error-soft text-error' },
  processing: { icon: RotateCw, title: 'Preparing roadmap', iconClass: 'bg-primary-soft text-primary' },
  queued: { icon: Clock3, title: 'Roadmap is queued', iconClass: 'bg-primary-soft text-primary-strong' }
};

export default function GeneratingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const jobId = searchParams.get('jobId');
  const isPersonalizeFlow = searchParams.get('personalize') === 'true';
  const startedRef = useRef(false);
  const redirectedRef = useRef(false);
  const [localError, setLocalError] = useState('');
  const [showSlowHint, setShowSlowHint] = useState(false);

  const onboardingStatusQuery = useQuery({
    queryKey: queryKeys.onboardingStatus,
    queryFn: onboardingApi.status,
    retry: false
  });
  const onboardingStatus = onboardingStatusQuery.data;

  const generateMutation = useMutation({ mutationFn: roadmapApi.generateOrGet });
  const retryMutation = useMutation({ mutationFn: roadmapApi.retryJob });

  const refreshLearningQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus }),
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmap }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    ]);
  };

  const redirectToDashboard = async () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    await refreshLearningQueries();
    navigate('/dashboard', { replace: true });
  };

  useEffect(() => {
    if (jobId || startedRef.current || onboardingStatusQuery.isLoading) return;

    if (onboardingStatus?.state === 'completed' || onboardingStatus?.hasActiveCourse) {
      redirectToDashboard();
      return;
    }

    const existingJob = onboardingStatus?.roadmapJob;
    if (existingJob?._id && ['queued', 'processing'].includes(existingJob.status)) {
      navigate(`/onboarding/generating?jobId=${existingJob._id}${isPersonalizeFlow ? '&personalize=true' : ''}`, { replace: true });
      return;
    }

    if (!['roadmap_pending', 'roadmap_failed'].includes(onboardingStatus?.state)) {
      setLocalError('Finish the current onboarding step before generating a roadmap.');
      return;
    }

    startedRef.current = true;
    setLocalError('');

    generateMutation.mutate(undefined, {
      onSuccess: async (result) => {
        if (result?.course || result?.mode === 'existing' || result?.mode === 'sync') {
          await redirectToDashboard();
          return;
        }

        if (result?.job?._id) {
          navigate(`/onboarding/generating?jobId=${result.job._id}${isPersonalizeFlow ? '&personalize=true' : ''}`, { replace: true });
          return;
        }

        setLocalError('Roadmap setup started, but no status was returned. Please try again.');
      },
      onError: (error) => setLocalError(error?.message || 'Could not start roadmap setup. Please try again.')
    });
  }, [jobId, onboardingStatus?.state, onboardingStatus?.hasActiveCourse, onboardingStatus?.roadmapJob?._id, onboardingStatusQuery.isLoading, isPersonalizeFlow]);

  const currentRoadmapQuery = useQuery({
    queryKey: queryKeys.roadmap,
    queryFn: roadmapApi.current,
    refetchInterval: 2000,
    retry: false
  });
  const currentCourse = currentRoadmapQuery.data?.course;

  const jobQuery = useQuery({
    queryKey: ['roadmap-job', jobId],
    queryFn: () => roadmapApi.jobStatus(jobId),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status;
      return status === 'completed' || status === 'failed' ? false : 2000;
    },
    retry: false
  });

  const job = jobQuery.data?.job;
  const jobCourse = jobQuery.data?.course;

  useEffect(() => {
    if (currentCourse || jobCourse || job?.status === 'completed') redirectToDashboard();
  }, [currentCourse?._id, jobCourse?._id, job?.status]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSlowHint(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  const meta = useMemo(() => statusMeta[job?.status] || statusMeta.processing, [job?.status]);
  const Icon = meta.icon;
  const displayedError = localError
    || onboardingStatusQuery.error?.message
    || generateMutation.error?.message
    || retryMutation.error?.message
    || jobQuery.error?.message
    || currentRoadmapQuery.error?.message;

  if (onboardingStatusQuery.isLoading || (!jobId && generateMutation.isPending)) return <Loader label="Preparing your roadmap..." />;

  const retryRoadmap = () => {
    setLocalError('');
    retryMutation.mutate(job._id, {
      onSuccess: async (result) => {
        if (result?.course || result?.mode === 'existing' || result?.mode === 'sync') {
          await redirectToDashboard();
          return;
        }

        const nextJobId = result?.job?._id || job._id;
        queryClient.setQueryData(['roadmap-job', nextJobId], {
          job: result?.job || { ...job, status: result?.mode || 'processing', error: '' },
          course: result?.course || null
        });
        await refreshLearningQueries();
        navigate(`/onboarding/generating?jobId=${nextJobId}${isPersonalizeFlow ? '&personalize=true' : ''}`, { replace: true });
      },
      onError: (error) => setLocalError(error?.message || 'Could not retry roadmap setup.')
    });
  };

  return <OnboardingShell
    current="roadmap"
    eyebrow="Step 4 · Roadmap setup"
    title="Preparing your learning roadmap"
    description="Your lessons, quizzes, projects, and practice flow are being connected. The dashboard opens automatically when the roadmap is ready."
    aside={<>
      <OnboardingInsightCard title="What happens here?" badge="Roadmap" items={[
        { title: 'Course structure', description: 'Published modules, lessons, quizzes, and practice tasks are connected to your selected learning path.' },
        { title: 'Honest fallback', description: 'When Gemini is unavailable, the backend can use a curated published template instead of inventing personalized content.' }
      ]} />
      <Card>
        <p className="font-bold text-foreground">Your work is reusable</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Existing courses and matching generation jobs are reused, so refreshing this screen should not create duplicate roadmaps.</p>
      </Card>
    </>}
  >
    <Card className="text-center">
      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-panel ${meta.iconClass}`}>
        <Icon className={job?.status === 'processing' || !job?.status ? 'animate-spin' : ''} aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-3xl font-bold text-foreground">{meta.title}</h2>
      <p className="mt-3 text-muted-foreground">{job ? `Current status: ${String(job.status).replaceAll('_', ' ')}` : 'Roadmap setup has started. Status updates will appear here.'}</p>
      <div className="mt-5"><ErrorMessage message={displayedError} /></div>

      {job && <div className="mt-6 rounded-panel bg-surface-secondary p-5 text-left">
        <div className="flex items-center justify-between gap-4"><b className="text-foreground">Setup status</b><StatusPill status={job.status} /></div>
        <p className="mt-2 text-sm text-muted-foreground">Type: {job.type || 'roadmap generation'} · Attempts: {job.attempts || 0}</p>
        {job.error && <div className="ui-alert ui-alert--error mt-3" role="alert">{job.error}</div>}
      </div>}

      {showSlowHint && !currentCourse && job?.status !== 'failed' && <div className="ui-alert ui-alert--info mt-6 text-left">
        Setup is taking longer than usual. This page continues checking the saved job, and refreshing it will reuse the same active work rather than create a duplicate.
      </div>}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {(currentCourse || jobCourse || job?.status === 'completed') && <Button onClick={redirectToDashboard}>Open dashboard</Button>}
        {job?.status === 'failed' && <>
          <Button onClick={retryRoadmap} isLoading={retryMutation.isPending} loadingLabel="Retrying roadmap...">Retry roadmap setup</Button>
          <Link to={isPersonalizeFlow ? '/dashboard' : '/onboarding/preferences'} className="ui-button ui-button--secondary">{isPersonalizeFlow ? 'Back to dashboard' : 'Back to setup'}</Link>
        </>}
      </div>
    </Card>
  </OnboardingShell>;
}
