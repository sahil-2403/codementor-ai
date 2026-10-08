import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Save } from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import QuizQuestionCard from '../../components/quiz/QuizQuestionCard.jsx';
import QuestionProgress from '../../components/quiz/QuestionProgress.jsx';
import { quizApi } from '../../api/quizApi.js';
import { buildAnswerPayload, countAnsweredQuestions } from '../../utils/questionnaire.js';

export default function QuizPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [quizError, setQuizError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const draftKey = useMemo(
    () =>
      data?.quiz?.courseId && moduleId
        ? `quiz-draft:${data.quiz.courseId}:${moduleId}`
        : '',
    [data?.quiz?.courseId, moduleId]
  );
  const [answers, setAnswers] = useState({});
  const [draftReady, setDraftReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!moduleId) return undefined;
    let active = true;
    setIsLoading(true);
    setQuizError(null);

    quizApi.moduleQuiz(moduleId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setQuizError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [moduleId, loadAttempt]);

  const quiz = data?.quiz;
  const questions = quiz?.questions || [];
  const questionSignature = questions.map((question) => question._id).join(':');
  const answeredCount = countAnsweredQuestions(questions, answers);

  useEffect(() => {
    setDraftReady(false);
    if (!draftKey || !questions.length) return;

    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || '{}');
      const questionIds = new Set(
        questions.map((question) => question._id)
      );
      setAnswers(
        saved && typeof saved === 'object'
          ? Object.fromEntries(
              Object.entries(saved).filter(([questionId]) =>
                questionIds.has(questionId)
              )
            )
          : {}
      );
    } catch {
      setAnswers({});
    } finally {
      setDraftReady(true);
    }
  }, [draftKey, questionSignature]);

  useEffect(() => {
    if (!draftKey || !draftReady) return;

    try {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    } catch {
      // Draft persistence is optional; quiz submission still works without local storage.
    }
  }, [draftKey, draftReady, answers]);

  if (isLoading) return <Loader label="Loading quiz..." />;

  if (quizError) {
    return (
      <EmptyState
        title="Quiz is unavailable"
        description={quizError.message}
        actionLabel="Back to roadmap"
        onAction={() => navigate('/roadmap')}
      />
    );
  }

  if (!quiz || !questions.length) {
    return (
      <EmptyState
        title="No quiz available"
        description="This module does not have a quiz yet."
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }

  const submit = async () => {
    setIsSubmitting(true);
    try {
      setError('');
      const payload = buildAnswerPayload(questions, answers);

      if (payload.length !== questions.length) {
        throw new Error('Please answer every question before submitting.');
      }

      const result = await quizApi.submit({ moduleId, answers: payload });

      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // Draft cleanup is optional after a successful submission.
        }
      }

      navigate(`/quizzes/result/${result.attempt._id}`);
    } catch (err) {
      setError(err?.message || 'Could not submit the quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-6">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-surface via-surface to-primary-soft/35 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-primary-strong">
              <span
                className="grid h-8 w-8 place-items-center rounded-control bg-primary-soft"
                aria-hidden="true"
              >
                <ClipboardCheck size={16} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
                Module quiz
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {quiz.moduleTitle || 'Module quiz'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Answer every question. Your result will show your score, correct
              answers, and topics to review.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="min-h-9 shrink-0 gap-2 px-3 text-xs sm:text-sm"
            onClick={() => navigate('/roadmap')}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Exit quiz
          </Button>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <QuestionProgress current={answeredCount} total={questions.length} label="Quiz completion" />
        </div>

        {draftKey && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Save size={13} aria-hidden="true" />
            Your answers are saved in this browser until you submit the quiz.
          </p>
        )}
      </Card>

      <ErrorMessage message={error} />

      {questions.map((question, index) => (
        <QuizQuestionCard
          key={question._id}
          question={question}
          index={index}
          value={answers[question._id]}
          onChange={(value) =>
            setAnswers((current) => ({
              ...current,
              [question._id]: value
            }))
          }
        />
      ))}

      <Card className="sticky bottom-4 z-10 border-primary/10 bg-surface/95 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">
              {answeredCount}/{questions.length} questions answered
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {answeredCount === questions.length
                ? 'Ready to submit. Review your answers before finishing.'
                : 'Answer every question before submitting the quiz.'}
            </p>
          </div>

          <Button
            className="shrink-0 px-6"
            onClick={submit}
            disabled={answeredCount !== questions.length}
            isLoading={isSubmitting}
            loadingLabel="Submitting quiz..."
          >
            Submit quiz
          </Button>
        </div>
      </Card>
    </div>
  );
}
