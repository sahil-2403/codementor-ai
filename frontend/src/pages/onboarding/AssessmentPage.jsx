import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assessmentApi } from '../../api/assessmentApi.js';
import { onboardingApi } from '../../api/onboardingApi.js';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Loader from '../../components/common/Loader.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import QuizQuestionCard from '../../components/quiz/QuizQuestionCard.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPersonalizeFlow = searchParams.get('personalize') === 'true';
  const personalizeQuery = isPersonalizeFlow ? '?personalize=true' : '';
  const { data: statusData, isLoading: statusLoading } = useQuery({ queryKey: ['onboarding-status'], queryFn: onboardingApi.status });
  const level = isPersonalizeFlow ? (statusData?.latestGoal?.level || 'intermediate') : (localStorage.getItem('learningLevel') || statusData?.latestGoal?.level || 'intermediate');
  const learningGoalId = isPersonalizeFlow ? statusData?.latestGoal?._id : (localStorage.getItem('learningGoalId') || statusData?.latestGoal?._id);
  const { data, isLoading } = useQuery({
    queryKey: ['assessment', level, learningGoalId],
    queryFn: () => assessmentApi.start({ level, learningGoalId }),
    enabled: Boolean(learningGoalId) && !statusLoading && level !== 'beginner',
    staleTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false
  });
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const questions = data?.questions || [];
  const answeredCount = useMemo(() => questions.filter((q) => answers[q._id]).length, [answers, questions]);
  const completion = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  if (statusLoading || isLoading) return <Loader label="Loading diagnostic assessment..." />;

  const submit = async () => {
    try {
      setSubmitting(true);
      setError('');
      const payload = questions.map((q) => ({ questionId: q._id, selectedAnswer: answers[q._id] || '' })).filter((a) => a.selectedAnswer);
      if (payload.length !== questions.length) throw new Error('Please answer all questions before submitting.');
      const result = await assessmentApi.submit({ learningGoalId, sessionId: data?.sessionId, answers: payload });
      navigate(`/onboarding/assessment-report/${result.assessment._id}${personalizeQuery}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <OnboardingShell
    current="setup"
    eyebrow="Diagnostic assessment"
    title={`${level} MERN skill check`}
    description="Answer all questions. You will see a diagnostic report first, then choose whether to generate a personalized roadmap from those results."
    backTo="/onboarding/assessment-intro"
    aside={<>
      <OnboardingInsightCard title="Assessment progress" badge={`${completion}%`} items={[
        { title: `${answeredCount}/${questions.length} answered`, description: 'All questions are required so the diagnostic report can calculate accurate weak-topic signals.' },
        { title: 'After submit', description: 'You will see category scores, strong/weak topics, and a roadmap recommendation before generation.' }
      ]} />
      <Card>
        <div className="mb-2 flex justify-between text-sm font-black text-slate-600"><span>Completion</span><span>{completion}%</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${completion}%` }} /></div>
      </Card>
    </>}
  >
    <ErrorMessage message={error} />
    <div className="space-y-5">
      {questions.map((question, index) => <QuizQuestionCard key={question._id} question={question} index={index} value={answers[question._id]} onChange={(value) => setAnswers({ ...answers, [question._id]: value })} />)}
    </div>
    <Card className="sticky bottom-4 z-10 flex flex-col gap-4 border border-indigo-100 bg-white/95 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div><p className="font-black text-slate-950">Ready to create your report?</p><p className="text-sm text-slate-500">Answer every question before submitting.</p></div>
      <Button className="px-6 py-3" onClick={submit} disabled={submitting || answeredCount !== questions.length}>{submitting ? 'Creating report...' : 'Submit assessment'}</Button>
    </Card>
  </OnboardingShell>;
}
