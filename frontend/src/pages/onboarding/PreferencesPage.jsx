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
import FormInput from '../../components/form/FormInput.jsx';
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
  const { data, isLoading } = useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: onboardingApi.status });
  const {
    register,
    handleSubmit,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(preferencesFormSchema), defaultValues: defaults });

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

  return (
    <OnboardingShell
      current="setup"
      eyebrow="Step 3 · Beginner setup"
      title="Set your pace without taking a test."
      description="Beginners should not be blocked by technical diagnostics. We use your time, goal, and learning style to create a safe roadmap and personalize the pace."
      backTo="/onboarding/level"
      aside={<>
        <OnboardingInsightCard title="Your roadmap will adjust" badge="Beginner" items={[
          { title: 'Pace', description: `${dailyTime || 0} minutes/day across ${targetDays || 0} days controls lesson density and revision spacing.` },
          { title: 'Focus', description: 'Job preparation gets more interview questions. Project focus gets more task cards and integration milestones.' }
        ]} />
        <Card className="bg-emerald-50"><ListChecks className="text-emerald-700" /><p className="mt-3 font-black text-emerald-950">No assessment needed</p><p className="mt-2 text-sm leading-6 text-emerald-900">You can take diagnostics later after completing foundation modules.</p></Card>
      </>}
    >
      <Card>
        <form onSubmit={handleSubmit(submit)} className="space-y-5">
          <ErrorMessage message={errors.root?.message} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4"><Clock className="text-indigo-600" /><FormInput className="mt-3" label="Daily study time in minutes" type="number" registration={register('dailyStudyTime')} error={errors.dailyStudyTime?.message} /></div>
            <div className="rounded-3xl bg-slate-50 p-4"><Target className="text-indigo-600" /><FormInput className="mt-3" label="Target duration in days" type="number" registration={register('targetDurationDays')} error={errors.targetDurationDays?.message} /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">Learning style</span><select className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" {...register('learningStyle')}><option value="project-based">Project based</option><option value="theory-first">Theory first</option><option value="interview-focused">Interview focused</option></select></label>
            <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">Main focus</span><select className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" {...register('mainFocus')}><option value="job-preparation">Job preparation</option><option value="project-building">Project building</option><option value="interview-revision">Interview revision</option></select></label>
          </div>
          <FormInput label="Known basics, comma separated" registration={register('knownBasics')} error={errors.knownBasics?.message} />
          <Button className="w-full py-4" disabled={isSubmitting}>{isSubmitting ? 'Saving setup...' : 'Continue to roadmap'}</Button>
        </form>
      </Card>
    </OnboardingShell>
  );
}
