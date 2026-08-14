import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { assessmentApi } from '../../api/assessmentApi.js';
import { onboardingApi } from '../../api/onboardingApi.js';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import QuizQuestionCard from '../../components/quiz/QuizQuestionCard.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPersonalizeFlow = searchParams.get('personalize') === 'true';
  const personalizeQuery = isPersonalizeFlow ? '?personalize=true' : '';
  const [statusData, setStatusData] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const enrollment = statusData?.currentEnrollment;
  const course = enrollment?.currentCourse || enrollment?.course;
  const level = enrollment?.level || 'intermediate';
  const enrollmentId = enrollment?._id;
  const assessmentRequestRef = useRef('');
  const [assessmentData, setAssessmentData] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setStatusLoading(true);
    setStatusError(null);

    onboardingApi.status()
      .then((result) => {
        if (active) setStatusData(result);
      })
      .catch((requestError) => {
        if (active) setStatusError(requestError);
      })
      .finally(() => {
        if (active) setStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!enrollmentId || statusLoading || level === 'beginner') return;
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
  }, [enrollmentId, level, statusLoading]);

  const questions = assessmentData?.questions || [];
  const answeredCount = useMemo(
    () => questions.filter((question) => answers[question._id]).length,
    [answers, questions]
  );
  const completion = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentQuestion = questions[currentIndex];
  const currentAnswered = Boolean(currentQuestion && answers[currentQuestion._id]);
  const lastQuestion = currentIndex === questions.length - 1;
  const backTo = isPersonalizeFlow ? '/dashboard' : '/onboarding/assessment-intro';

  const submit = async () => {
    try {
      setSubmitting(true);
      setError('');
      const payload = questions
        .map((question) => ({
          questionId: question._id,
          selectedAnswer: answers[question._id] || ''
        }))
        .filter((answer) => answer.selectedAnswer);

      if (payload.length !== questions.length) {
        throw new Error('Please answer all questions before submitting.');
      }

      const result = await assessmentApi.submit({
        enrollmentId,
        sessionId: assessmentData?.sessionId,
        answers: payload
      });

      navigate(`/onboarding/assessment-report/${result.assessment._id}${personalizeQuery}`);
    } catch (err) {
      setError(err?.message || 'Could not submit your answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const movePrevious = () => {
    if (currentIndex === 0) {
      navigate(backTo);
      return;
    }
    setCurrentIndex((index) => index - 1);
  };

  const moveNext = () => {
    if (!currentAnswered || lastQuestion) return;
    setCurrentIndex((index) => index + 1);
  };

  if (statusLoading || assessmentLoading) return <Loader label="Loading your skill check..." />;

  if (statusError) {
    return (
      <EmptyState
        title="Your setup could not load"
        description={statusError.message}
        actionLabel="Back to dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }
  if (level === 'beginner') {
    return (
      <EmptyState
        title="No skill check is required"
        description="Beginner setup uses your learning preferences to create a foundation-first roadmap."
        actionLabel="Continue setup"
        onAction={() => navigate(isPersonalizeFlow ? '/dashboard' : '/onboarding/preferences')}
      />
    );
  }
  if (!enrollmentId || !course) {
    return (
      <EmptyState
        title="Course enrollment not found"
        description="Choose a course or learning path before starting a diagnostic."
        actionLabel={isPersonalizeFlow ? 'Back to dashboard' : 'Open learning catalog'}
        onAction={() => navigate(isPersonalizeFlow ? '/dashboard' : '/onboarding/catalog')}
      />
    );
  }
  if (assessmentError || !questions.length || !currentQuestion) {
    return (
      <EmptyState
        title="Skill check unavailable"
        description={assessmentError?.message || `No ${level} skill-check questions are available for ${course.title} yet.`}
        actionLabel="Back to options"
        onAction={() => navigate(backTo)}
      />
    );
  }

  return (
    <OnboardingShell
      current="setup"
      eyebrow="Skill check"
      title={`${course.title} skill check`}
      description={`Answer one ${level} question at a time. All questions must be answered before submitting.`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={movePrevious} disabled={submitting} className="gap-2">
            <ArrowLeft size={16} aria-hidden="true" /> Previous
          </Button>

          {lastQuestion ? (
            <Button
              type="button"
              onClick={submit}
              disabled={answeredCount !== questions.length}
              isLoading={submitting}
              loadingLabel="Submitting..."
              className="px-6"
            >
              Submit assessment
            </Button>
          ) : (
            <Button type="button" onClick={moveNext} disabled={!currentAnswered} className="gap-2 px-6">
              Next <ArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      }
    >
      <ErrorMessage message={error} />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm font-semibold">
          <span className="text-foreground">Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-muted-foreground">{completion}% complete</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-surface-secondary"
          role="progressbar"
          aria-label="Skill check completion"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={completion}
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        <QuizQuestionCard
          question={currentQuestion}
          index={currentIndex}
          value={answers[currentQuestion._id]}
          onChange={(value) => setAnswers((current) => ({
            ...current,
            [currentQuestion._id]: value
          }))}
        />
      </div>
    </OnboardingShell>
  );
}
