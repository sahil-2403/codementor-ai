import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BriefcaseBusiness,
  MessageSquareText,
  Send,
  Sparkles
} from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import LevelBadge from '../../components/common/LevelBadge.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import FormTextarea from '../../components/form/FormTextarea.jsx';
import InterviewAttemptFeedback from '../../components/interview/InterviewAttemptFeedback.jsx';
import InterviewQuestionSelector from '../../components/interview/InterviewQuestionSelector.jsx';
import { interviewApi } from '../../api/interviewApi.js';
import { interviewAnswerSchema } from '../../validations/interview.schema.js';
import notify from '../../utils/notify.js';

const MAX_ATTEMPTS = 2;
const formatQuestionType = (value) => String(value || '').replaceAll('_', ' ');

export default function InterviewPage() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [retryingId, setRetryingId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(interviewAnswerSchema),
    defaultValues: { answer: '' }
  });

  useEffect(() => {
    let active = true;
    setLoadError(null);

    Promise.all([interviewApi.questions(), interviewApi.attempts()])
      .then(([questionsResult, attemptsResult]) => {
        if (!active) return;
        setQuestions(questionsResult?.questions || []);
        setAttempts(attemptsResult?.attempts || []);
      })
      .catch((requestError) => {
        if (active) setLoadError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const topics = useMemo(
    () => Object.entries(
      questions.reduce((groups, question) => {
        groups[question.topic] = groups[question.topic] || [];
        groups[question.topic].push(question);
        return groups;
      }, {})
    ),
    [questions]
  );

  const currentTopic = selectedTopic || topics[0]?.[0] || '';
  const topicQuestions = topics.find(([topic]) => topic === currentTopic)?.[1] || [];
  const selectedQuestion = useMemo(
    () => questions.find((item) => item._id === selectedQuestionId) || topicQuestions[0],
    [questions, selectedQuestionId, topicQuestions]
  );
  const selectedAttempts = attempts.filter(
    (attempt) => attempt.question?._id === selectedQuestion?._id
  );
  const attemptsUsed = selectedAttempts.length;
  const canSubmit = Boolean(selectedQuestion) && attemptsUsed < MAX_ATTEMPTS;
  const expectedAnswer =
    selectedAttempts[0]?.aiFeedback?.expectedAnswer ||
    selectedAttempts[0]?.question?.expectedAnswer ||
    '';

  const resetWorkspace = () => {
    clearErrors();
    reset({ answer: '' });
  };

  const chooseTopic = (topic) => {
    setSelectedTopic(topic);
    const firstQuestion = topics.find(([name]) => name === topic)?.[1]?.[0];
    setSelectedQuestionId(firstQuestion?._id || '');
    resetWorkspace();
  };

  const chooseQuestion = (questionId) => {
    setSelectedQuestionId(questionId);
    resetWorkspace();
  };

  const submit = async (values) => {
    if (!selectedQuestion?._id) return;

    try {
      const result = await interviewApi.submit({
        questionId: selectedQuestion._id,
        answer: values.answer
      });
      reset({ answer: '' });
      setLoadAttempt((value) => value + 1);

      if (result?.attempt?.status === 'reviewed') {
        notify.success('Mentor feedback is ready');
      } else {
        notify.warning('Your answer is saved. Mentor feedback is temporarily unavailable.');
      }
    } catch (error) {
      notify.error(error?.message || 'Could not save your interview answer');
    }
  };

  const retryReview = async (attemptId) => {
    try {
      setRetryingId(attemptId);
      const result = await interviewApi.retryReview(attemptId);
      setLoadAttempt((value) => value + 1);

      if (result?.attempt?.status === 'reviewed') {
        notify.success('Mentor feedback is ready');
      } else {
        notify.warning('Mentor feedback is still unavailable. Your saved answer is unchanged.');
      }
    } catch (error) {
      notify.error(error?.message || 'Could not retry mentor feedback');
    } finally {
      setRetryingId(null);
    }
  };

  if (isLoading) return <Loader label="Loading interview practice..." />;

  if (loadError) {
    return (
      <EmptyState
        title="Interview practice could not load"
        description={loadError.message || 'Try refreshing the page.'}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }

  return (
    <PageShell className="space-y-6 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Interview practice"
        eyebrowIcon={BriefcaseBusiness}
        title="Practice interview answers"
        description="Choose a question, answer it in your own words, and use mentor feedback to improve."
      />

      {!questions.length ? (
        <EmptyState
          title="No interview questions available"
          description="Interview questions will appear here when they are added."
        />
      ) : (
        <>
          <section className="rounded-surface border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground">Choose a question</h2>
              <span className="text-xs font-semibold text-muted-foreground">{questions.length} questions</span>
            </div>
            <InterviewQuestionSelector
              topics={topics}
              currentTopic={currentTopic}
              topicQuestions={topicQuestions}
              selectedQuestionId={selectedQuestion?._id || ''}
              onTopicChange={chooseTopic}
              onQuestionChange={chooseQuestion}
            />
          </section>

          {selectedQuestion ? (
            <section className="rounded-surface border border-border bg-surface p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-surface-secondary text-muted-foreground" aria-hidden="true">
                  <MessageSquareText size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <LevelBadge level={selectedQuestion.difficulty} />
                    <Badge variant="neutral" className="capitalize">{formatQuestionType(selectedQuestion.type)}</Badge>
                    <Badge variant={canSubmit ? 'neutral' : 'warning'}>{attemptsUsed}/{MAX_ATTEMPTS} attempts</Badge>
                  </div>
                  <h2 className="mt-3 text-lg font-bold leading-7 text-foreground sm:text-xl">{selectedQuestion.question}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedQuestion.topic}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
                {!canSubmit ? (
                  <InlineAlert tone="warning" title="Attempt limit reached">
                    You have used both attempts for this question. Review your saved feedback and the expected answer below.
                  </InlineAlert>
                ) : null}

                <FormTextarea
                  label="Your answer"
                  className="min-h-52"
                  placeholder="Explain the concept clearly and add a small example when it helps."
                  registration={register('answer')}
                  error={errors.answer?.message}
                  disabled={!canSubmit}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    isLoading={isSubmitting}
                    loadingLabel="Saving and reviewing..."
                    className="border-primary/20 bg-primary-soft text-primary-strong hover:bg-primary-soft/70"
                  >
                    <Sparkles size={15} aria-hidden="true" />
                    Submit for Mentor Review
                  </Button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="rounded-surface border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground">Your attempts</h2>
              <span className="text-xs font-semibold text-muted-foreground">{selectedAttempts.length}/{MAX_ATTEMPTS} attempts</span>
            </div>

            {selectedAttempts.length ? (
              <>
                <div className="mt-4 border-l-2 border-primary pl-4">
                  <div className="flex items-center gap-2 text-primary-strong">
                    <Sparkles size={16} aria-hidden="true" />
                    <h3 className="font-bold">Expected answer</h3>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {expectedAnswer || 'The expected answer is available in your saved feedback.'}
                  </p>
                </div>

                <div className="mt-5 divide-y divide-border">
                  {selectedAttempts.map((attempt, index) => (
                    <InterviewAttemptFeedback
                      key={attempt._id}
                      attempt={attempt}
                      attemptNumber={selectedAttempts.length - index}
                      isRetrying={retryingId === attempt._id}
                      onRetry={() => retryReview(attempt._id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-3">
                <EmptyState
                  title="No attempts yet"
                  description="Submit your first answer to unlock the expected answer and mentor feedback."
                />
              </div>
            )}
          </section>
        </>
      )}
    </PageShell>
  );
}
