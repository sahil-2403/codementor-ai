import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, ListChecks, Target } from 'lucide-react';
import { onboardingApi } from '../../api/onboardingApi.js';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import FormInput from '../../components/form/FormInput.jsx';
import Select from '../../components/common/Select.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import { preferencesFormSchema } from '../../validations/onboarding.schema.js';
import { queryKeys } from '../../constants/queryKeys.js';

const defaults = {
  dailyStudyTime: 120,
  targetDurationDays: 90,
  learningStyle: 'project-based',
  knownBasics: '',
  mainFocus: 'job-preparation'
};

export default function PreferencesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error: statusError, refetch } = useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: onboardingApi.status, retry: false });
  const enrollment = data?.currentEnrollment;
  const offering = enrollment?.type === 'learning_path' ? enrollment?.learningPath : enrollment?.course;
  const { register, handleSubmit, setError, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: defaults
  });

  useEffect(() => {
    if (!enrollment) return;
    reset({
      dailyStudyTime: enrollment.dailyStudyTime ?? defaults.dailyStudyTime,
      targetDurationDays: enrollment.targetDurationDays ?? defaults.targetDurationDays,
      learningStyle: enrollment.learningStyle || defaults.learningStyle,
      knownBasics: enrollment.knownBasics?.length ? enrollment.knownBasics.join(', ') : defaults.knownBasics,
      mainFocus: enrollment.mainFocus || defaults.mainFocus
    });
  }, [enrollment?._id, reset]);

  const dailyTime = Number(watch('dailyStudyTime') || 0);
  const targetDays = Number(watch('targetDurationDays') || 0);

  const submit = async (values) => {
    if (!enrollment?._id) return;
    try {
      const result = await onboardingApi.savePreferences({
        enrollmentId: enrollment._id,
        dailyStudyTime: Number(values.dailyStudyTime),
        targetDurationDays: Number(values.targetDurationDays),
        learningStyle: values.learningStyle,
        knownBasics: values.knownBasics.split(',').map((item) => item.trim()).filter(Boolean),
        mainFocus: values.mainFocus
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus });
      navigate(result?.enrollment?.onboardingState === 'roadmap_pending' ? '/onboarding/generating' : '/onboarding/assessment-intro');
    } catch (err) {
      setError('root', { message: err?.message || 'Could not save your preferences.' });
    }
  };

  if (isLoading) return <Loader label="Loading your learning preferences..." />;
  if (statusError) return <EmptyState title="Your preferences could not load" description={statusError.message} actionLabel="Try again" onAction={() => refetch()} />;
  if (!enrollment || !offering) return <EmptyState title="Your course selection is missing" description="Choose a course or learning path before setting preferences." actionLabel="Open learning catalog" onAction={() => navigate('/onboarding/catalog')} />;

  const assessmentOptional = enrollment.level !== 'beginner';

  return <OnboardingShell
    current="setup"
    eyebrow="Step 3 · Learning preferences"
    title="Set a learning pace that works for you"
    description={`Tell us how you want to study ${offering.title}. These preferences adjust pacing and personalization without changing the course curriculum.`}
    backTo="/onboarding/level"
    aside={<>
      <OnboardingInsightCard title={`${offering.title} setup`} badge={enrollment.level || 'Course'} items={[
        { title: 'Pace', description: `${dailyTime || 0} minutes per day across ${targetDays || 0} days helps shape the recommended study pace.` },
        { title: 'Focus', description: 'Job preparation emphasizes interview readiness, while project building emphasizes implementation practice.' }
      ]} />
      <Card className={assessmentOptional ? 'bg-primary-soft' : 'bg-success-soft'}>
        <ListChecks className={assessmentOptional ? 'text-primary' : 'text-success'} />
        <p className="mt-3 font-bold text-foreground">{assessmentOptional ? 'Skill check is optional' : 'No skill check required'}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {assessmentOptional
            ? `After saving these preferences, you can take a ${enrollment.level} diagnostic for ${enrollment.currentCourse?.title || offering.title} or continue without it.`
            : 'Beginner learners start from the course foundations and can take diagnostics later.'}
        </p>
      </Card>
    </>}
  >
    <Card>
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <ErrorMessage message={errors.root?.message} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-surface bg-surface-secondary p-4"><Clock className="text-primary" aria-hidden="true" /><FormInput className="mt-3" label="Minutes available per day" type="number" min="15" max="600" registration={register('dailyStudyTime')} error={errors.dailyStudyTime?.message} /></div>
          <div className="rounded-surface bg-surface-secondary p-4"><Target className="text-primary" aria-hidden="true" /><FormInput className="mt-3" label="Goal timeframe in days" type="number" min="7" max="365" registration={register('targetDurationDays')} error={errors.targetDurationDays?.message} /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Learning style" {...register('learningStyle')} error={errors.learningStyle?.message}>
            <option value="project-based">Learn through projects</option>
            <option value="theory-first">Learn concepts first</option>
            <option value="interview-focused">Focus on interviews</option>
          </Select>
          <Select label="Main goal" {...register('mainFocus')} error={errors.mainFocus?.message}>
            <option value="job-preparation">Prepare for a job</option>
            <option value="project-building">Build stronger projects</option>
            <option value="interview-revision">Revise for interviews</option>
          </Select>
        </div>
        <FormInput label="Skills you already know" registration={register('knownBasics')} error={errors.knownBasics?.message} placeholder="Example: HTML, Git, Java basics" />
        <p className="-mt-3 text-xs text-muted-foreground">Optional. Separate multiple skills with commas.</p>
        <Button type="submit" className="w-full" isLoading={isSubmitting} loadingLabel="Saving setup...">
          {assessmentOptional ? 'Continue to skill check choice' : 'Create my roadmap'}
        </Button>
      </form>
    </Card>
  </OnboardingShell>;
}
