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
  knownBasics: 'HTML,CSS,Basic JavaScript',
  mainFocus: 'job-preparation'
};

export default function PreferencesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error: statusError, refetch } = useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: onboardingApi.status, retry: false });
  const { register, handleSubmit, setError, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: defaults
  });

  useEffect(() => {
    const goal = data?.currentGoal;
    if (!goal) return;
    reset({
      dailyStudyTime: goal.dailyStudyTime ?? defaults.dailyStudyTime,
      targetDurationDays: goal.targetDurationDays ?? defaults.targetDurationDays,
      learningStyle: goal.learningStyle || defaults.learningStyle,
      knownBasics: goal.knownBasics?.length ? goal.knownBasics.join(',') : defaults.knownBasics,
      mainFocus: goal.mainFocus || defaults.mainFocus
    });
  }, [data?.currentGoal?._id, reset]);

  const dailyTime = Number(watch('dailyStudyTime') || 0);
  const targetDays = Number(watch('targetDurationDays') || 0);

  const submit = async (values) => {
    try {
      const result = await onboardingApi.savePreferences({
        dailyStudyTime: Number(values.dailyStudyTime),
        targetDurationDays: Number(values.targetDurationDays),
        learningStyle: values.learningStyle,
        knownBasics: values.knownBasics.split(',').map((item) => item.trim()).filter(Boolean),
        mainFocus: values.mainFocus
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus });
      navigate(result?.goal?.onboardingState === 'roadmap_pending' ? '/onboarding/generating' : '/onboarding/assessment-intro');
    } catch (err) {
      setError('root', { message: err?.message || 'Could not save your preferences.' });
    }
  };

  if (isLoading) return <Loader label="Loading your learning preferences..." />;
  if (statusError) return <EmptyState title="Your preferences could not load" description={statusError.message} actionLabel="Try again" onAction={() => refetch()} />;

  return <OnboardingShell
    current="setup"
    eyebrow="Step 3 · Beginner setup"
    title="Set a learning pace that works for you"
    description="Tell us how much time you have, how quickly you want to progress, and how you prefer to learn."
    backTo="/onboarding/level"
    aside={<>
      <OnboardingInsightCard title="Your plan will adjust" badge="Beginner" items={[
        { title: 'Pace', description: `${dailyTime || 0} minutes per day across ${targetDays || 0} days helps decide how much to study each week.` },
        { title: 'Focus', description: 'Job preparation adds more interview practice, while project building adds more implementation work.' }
      ]} />
      <Card className="bg-success-soft"><ListChecks className="text-success" /><p className="mt-3 font-bold text-foreground">No skill check required</p><p className="mt-2 text-sm leading-6 text-muted-foreground">You can take an optional skill check later after completing the foundations.</p></Card>
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
        <FormInput label="Skills you already know" registration={register('knownBasics')} error={errors.knownBasics?.message} placeholder="HTML, CSS, Basic JavaScript" />
        <p className="-mt-3 text-xs text-muted-foreground">Separate multiple skills with commas.</p>
        <Button type="submit" className="w-full" isLoading={isSubmitting} loadingLabel="Saving setup...">Continue to roadmap</Button>
      </form>
    </Card>
  </OnboardingShell>;
}
