import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assessmentApi } from '../../api/assessmentApi.js';
import { onboardingApi } from '../../api/onboardingApi.js';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Loader from '../../components/common/Loader.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import QuizQuestionCard from '../../components/quiz/QuizQuestionCard.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import { queryKeys } from '../../constants/queryKeys.js';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPersonalizeFlow = searchParams.get('personalize') === 'true';
  const personalizeQuery = isPersonalizeFlow ? '?personalize=true' : '';
  const { data: statusData, isLoading: statusLoading, error: statusError } = useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: onboardingApi.status });
  const level = statusData?.currentGoal?.level || statusData?.latestGoal?.level || 'intermediate';
  const learningGoalId = statusData?.currentGoal?._id || statusData?.latestGoal?._id;
  const { data, isLoading, error: assessmentError } = useQuery({
    queryKey: ['assessment', level, learningGoalId],
    queryFn: () => assessmentApi.start({ level, learningGoalId }),
    enabled: Boolean(learningGoalId) && !statusLoading && level !== 'beginner',
    staleTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
    retry: false
  });
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const questions = data?.questions || [];
  const answeredCount = useMemo(() => questions.filter((question) => answers[question._id]).length, [answers, questions]);
  const completion = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const backTo = isPersonalizeFlow ? '/dashboard' : '/onboarding/assessment-intro';

  if (statusLoading || isLoading) return <Loader label="Loading diagnostic assessment..." />;

  const submit = async () => {
    try {
      setSubmitting(true);
      setError('');
      const payload = questions.map((question) => ({ questionId: question._id, selectedAnswer: answers[question._id] || '' })).filter((answer) => answer.selectedAnswer);
      if (payload.length !== questions.length) throw new Error('Please answer all questions before submitting.');
      const result = await assessmentApi.submit({ learningGoalId, sessionId: data?.sessionId, answers: payload });
      navigate(`/onboarding/assessment-report/${result.assessment._id}${personalizeQuery}`);
    } catch (err) {
      setError(err?.message || 'Could not submit the assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (statusError) return <EmptyState title="Onboarding status is unavailable" description={statusError.message} actionLabel="Back to dashboard" onAction={() => navigate('/dashboard')} />;
  if (level === 'beginner') return <EmptyState title="No diagnostic is required" description="Beginner onboarding uses your learning preferences instead of inventing an assessment score." actionLabel="Continue setup" onAction={() => navigate('/onboarding/preferences')} />;
  if (!learningGoalId) return <EmptyState title="Learning goal not found" description="Restart onboarding so the diagnostic can be connected to a real learning goal." actionLabel="Restart onboarding" onAction={() => navigate('/onboarding/goal')} />;
  if (assessmentError || !questions.length) return <EmptyState title="Diagnostic is unavailable" description={assessmentError?.message || 'No published diagnostic questions are available for this level yet.'} actionLabel="Back to options" onAction={() => navigate(backTo)} />;

  return <OnboardingShell
    current="setup"
    eyebrow="Diagnostic assessment"
    title={`${level} MERN skill check`}
    description="Answer every published question. You will review the report before deciding whether to generate a personalized roadmap."
    backTo={backTo}
    aside={<>
      <OnboardingInsightCard title="Assessment progress" badge={`${completion}%`} items={[
        { title: `${answeredCount}/${questions.length} answered`, description: 'All questions are required so category scores use a complete and consistent question set.' },
        { title: 'After submission', description: 'You will see stored category scores, strong topics, weak topics, and the roadmap recommendation.' }
      ]} />
      <Card>
        <div className="mb-2 flex justify-between text-sm font-semibold text-muted-foreground"><span>Completion</span><span>{completion}%</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-secondary" role="progressbar" aria-label="Assessment completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} />
        </div>
      </Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="space-y-5">
      {questions.map((question, index) => <QuizQuestionCard key={question._id} question={question} index={index} value={answers[question._id]} onChange={(value) => setAnswers((current) => ({ ...current, [question._id]: value }))} />)}
    </div>
    <Card className="sticky bottom-4 z-10 flex flex-col gap-4 bg-surface/95 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div><p className="font-bold text-foreground">Ready to create your report?</p><p className="text-sm text-muted-foreground">Answer every question before submitting.</p></div>
      <Button onClick={submit} disabled={answeredCount !== questions.length} isLoading={submitting} loadingLabel="Creating report..." className="px-6">Submit assessment</Button>
    </Card>
  </OnboardingShell>;
}
