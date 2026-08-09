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
  completed: { icon: CheckCircle2, title: 'Your roadmap is ready', iconClass: 'bg-success-soft text-success' },
  failed: { icon: XCircle, title: 'We could not finish your roadmap', iconClass: 'bg-error-soft text-error' },
  processing: { icon: RotateCw, title: 'Building your roadmap', iconClass: 'bg-primary-soft text-primary' },
  queued: { icon: Clock3, title: 'Your roadmap is waiting to start', iconClass: 'bg-primary-soft text-primary-strong' }
};

const sameId = (left, right) => Boolean(left && right && String(left) === String(right));

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
  const enrollment = onboardingStatus?.currentEnrollment;
  const offering = enrollment?.type === 'learning_path' ? enrollment?.learningPath : enrollment?.course;
  const currentCourse = enrollment?.currentCourse || enrollment?.course;
  const targetEnrollmentId = enrollment?._id;
  const activeCourseMatchesEnrollment = sameId(onboardingStatus?.activeCourse?.enrollment, targetEnrollmentId);

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

    if (onboardingStatus?.state === 'completed' && activeCourseMatchesEnrollment) {
      redirectToDashboard();
      return;
    }

    const existingJob = onboardingStatus?.roadmapJob;
    if (existingJob?._id && ['queued', 'processing'].includes(existingJob.status)) {
      navigate(`/onboarding/generating?jobId=${existingJob._id}${isPersonalizeFlow ? '&personalize=true' : ''}`, { replace: true });
      return;
    }

    if (!targetEnrollmentId) {
      setLocalError('Choose a course or learning path before creating a roadmap.');
      return;
    }

    if (!['roadmap_pending', 'roadmap_failed'].includes(onboardingStatus?.state)) {
      setLocalError('Finish your current setup step before creating a roadmap.');
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

        setLocalError('We started creating your roadmap, but could not check its progress. Please try again.');
      },
      onError: (error) => setLocalError(error?.message || 'Could not start creating your roadmap. Please try again.')
    });
  }, [jobId, onboardingStatus?.state, onboardingStatus?.roadmapJob?._id, onboardingStatusQuery.isLoading, isPersonalizeFlow, targetEnrollmentId, activeCourseMatchesEnrollment]);

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
    if (jobCourse || job?.status === 'completed') redirectToDashboard();
  }, [jobCourse?._id, job?.status]);

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
    || jobQuery.error?.message;

  if (onboardingStatusQuery.isLoading || (!jobId && generateMutation.isPending)) return <Loader label="Creating your roadmap..." />;

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
      onError: (error) => setLocalError(error?.message || 'Could not try again. Please check your connection and retry.')
    });
  };

  return <OnboardingShell
    current="roadmap"
    eyebrow="Step 4 · Create your roadmap"
    title={`Creating ${offering?.title || currentCourse?.title || 'your course'} roadmap`}
    description="We’re organising this enrollment’s lessons, quizzes, projects, and practice without affecting any other course you may be learning."
    aside={<>
      <OnboardingInsightCard title="What is being prepared?" badge="Course roadmap" items={[
        { title: 'Enrollment-specific plan', description: `This roadmap belongs only to ${offering?.title || currentCourse?.title || 'the selected course'} and its chosen level.` },
        { title: 'Authoritative curriculum', description: 'Personalization may change emphasis and pacing, but lesson and quiz references still come from the selected course template.' }
      ]} />
      <Card>
        <p className="font-bold text-foreground">Other courses stay independent</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Refreshing this page continues the same enrollment job. Existing course roadmaps are not replaced by this generation.</p>
      </Card>
    </>}
  >
    <Card className="text-center">
      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-panel ${meta.iconClass}`}>
        <Icon className={job?.status === 'processing' || !job?.status ? 'animate-spin' : ''} aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-3xl font-bold text-foreground">{meta.title}</h2>
      <p className="mt-3 text-muted-foreground">{job ? `Status: ${String(job.status).replaceAll('_', ' ')}` : 'Your course roadmap is being prepared. Updates will appear here.'}</p>
      <div className="mt-5"><ErrorMessage message={displayedError} /></div>

      {job && <div className="mt-6 rounded-panel bg-surface-secondary p-5 text-left">
        <div className="flex items-center justify-between gap-4"><b className="text-foreground">Roadmap status</b><StatusPill status={job.status} /></div>
        <p className="mt-2 text-sm text-muted-foreground">This page updates automatically while this enrollment roadmap is being created.</p>
        {job.error && <div className="ui-alert ui-alert--error mt-3" role="alert">We could not finish your roadmap. Please try again.</div>}
      </div>}

      {showSlowHint && !jobCourse && job?.status !== 'failed' && <div className="ui-alert ui-alert--info mt-6 text-left">
        This is taking longer than usual. You can keep this page open or refresh it; the same enrollment job will continue.
      </div>}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {(jobCourse || job?.status === 'completed') && <Button onClick={redirectToDashboard}>Open dashboard</Button>}
        {job?.status === 'failed' && <>
          <Button onClick={retryRoadmap} isLoading={retryMutation.isPending} loadingLabel="Trying again...">Try again</Button>
          <Link to={isPersonalizeFlow ? '/dashboard' : '/onboarding/preferences'} className="ui-button ui-button--secondary">{isPersonalizeFlow ? 'Back to dashboard' : 'Back to setup'}</Link>
        </>}
      </div>
    </Card>
  </OnboardingShell>;
}
