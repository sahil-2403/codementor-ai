import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { useAsyncData } from '../../hooks/useAsyncData.js';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPersonalizeFlow = searchParams.get('personalize') === 'true';
  const personalizeQuery = isPersonalizeFlow ? '?personalize=true' : '';
  const statusQuery = useAsyncData(onboardingApi.status);
  const enrollment = statusQuery.data?.currentEnrollment;
  const course = enrollment?.currentCourse || enrollment?.course;
  const level = enrollment?.level || 'intermediate';
  const enrollmentId = enrollment?._id;
  const assessmentRequestRef = useRef('');
  const [assessmentData, setAssessmentData] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!enrollmentId || statusQuery.isLoading || level === 'beginner') return;
    const requestKey = `${enrollmentId}:${level}`;
    if (assessmentRequestRef.current === requestKey) return;
    assessmentRequestRef.current = requestKey;
    setAssessmentLoading(true);
    setAssessmentError(null);

    assessmentApi.start({ level, enrollmentId })
      .then((result) => setAssessmentData(result))
      .catch((requestError) => {
        setAssessmentError(requestError);
        assessmentRequestRef.current = '';
      })
      .finally(() => setAssessmentLoading(false));
  }, [enrollmentId, level, statusQuery.isLoading]);

  const questions = assessmentData?.questions || [];
  const answeredCount = useMemo(() => questions.filter((question) => answers[question._id]).length, [answers, questions]);
  const completion = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const backTo = isPersonalizeFlow ? '/dashboard' : '/onboarding/assessment-intro';

  if (statusQuery.isLoading || assessmentLoading) return <Loader label="Loading your skill check..." />;

  const submit = async () => {
    try {
      setSubmitting(true);
      setError('');
      const payload = questions
        .map((question) => ({ questionId: question._id, selectedAnswer: answers[question._id] || '' }))
        .filter((answer) => answer.selectedAnswer);
      if (payload.length !== questions.length) throw new Error('Please answer all questions before submitting.');
      const result = await assessmentApi.submit({ enrollmentId, sessionId: assessmentData?.sessionId, answers: payload });
      navigate(`/onboarding/assessment-report/${result.assessment._id}${personalizeQuery}`);
    } catch (err) {
      setError(err?.message || 'Could not submit your answers.');
    } finally {
      setSubmitting(false);
    }
  };

  if (statusQuery.error) return <EmptyState title="Your setup could not load" description={statusQuery.error.message} actionLabel="Back to dashboard" onAction={() => navigate('/dashboard')} />;
  if (level === 'beginner') return <EmptyState title="No skill check is required" description="Beginner setup uses your learning preferences to create a foundation-first roadmap." actionLabel="Continue setup" onAction={() => navigate(isPersonalizeFlow ? '/dashboard' : '/onboarding/preferences')} />;
  if (!enrollmentId || !course) return <EmptyState title="Course enrollment not found" description="Choose a course or learning path before starting a diagnostic." actionLabel={isPersonalizeFlow ? 'Back to dashboard' : 'Open learning catalog'} onAction={() => navigate(isPersonalizeFlow ? '/dashboard' : '/onboarding/catalog')} />;
  if (assessmentError || !questions.length) return <EmptyState title="Skill check unavailable" description={assessmentError?.message || `No ${level} skill-check questions are available for ${course.title} yet.`} actionLabel="Back to options" onAction={() => navigate(backTo)} />;

  return <OnboardingShell
    current="setup"
    eyebrow="Course skill check"
    title={`${level[0].toUpperCase()}${level.slice(1)} ${course.title} skill check`}
    description="Answer every question, then review your topic scores before generating or updating this course roadmap."
    backTo={backTo}
    aside={<>
      <OnboardingInsightCard title="Your progress" badge={`${completion}%`} items={[
        { title: `${answeredCount}/${questions.length} answered`, description: 'Answer every question to get a complete result.' },
        { title: 'Course-scoped questions', description: `Every question comes from ${course.title}; diagnostics from unrelated technologies are excluded.` }
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
      <div><p className="font-bold text-foreground">Ready to see your results?</p><p className="text-sm text-muted-foreground">Answer every question before submitting.</p></div>
      <Button onClick={submit} disabled={answeredCount !== questions.length} isLoading={submitting} loadingLabel="Preparing results..." className="px-6">Submit answers</Button>
    </Card>
  </OnboardingShell>;
}
