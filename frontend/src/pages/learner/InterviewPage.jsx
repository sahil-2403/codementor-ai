import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpenCheck,
  BriefcaseBusiness,
  ChevronDown,
  History,
  MessageSquareText,
  Send,
  Sparkles
} from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import FormTextarea from '../../components/form/FormTextarea.jsx';
import InterviewAttemptFeedback from '../../components/interview/InterviewAttemptFeedback.jsx';
import {
  useInterviewAttempts,
  useInterviewQuestions,
  useRetryInterviewReview,
  useSubmitInterviewAnswer
} from '../../queries/interviewQueries.js';
import { interviewAnswerSchema } from '../../validations/interview.schema.js';

const MAX_ATTEMPTS = 2;

const formatQuestionType = (value) => String(value || '').replaceAll('_', ' ');

export default function InterviewPage() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [notice, setNotice] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const questionsQuery = useInterviewQuestions();
  const attemptsQuery = useInterviewAttempts();
  const submitMutation = useSubmitInterviewAnswer();
  const retryMutation = useRetryInterviewReview();
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(interviewAnswerSchema),
    defaultValues: { answer: '' }
  });

  const questions = questionsQuery.data?.questions || [];
  const attempts = attemptsQuery.data?.attempts || [];
  const topics = useMemo(
    () =>
      Object.entries(
        questions.reduce((groups, question) => {
          groups[question.topic] = groups[question.topic] || [];
          groups[question.topic].push(question);
          return groups;
        }, {})
      ),
    [questions]
  );
  const currentTopic = selectedTopic || topics[0]?.[0] || '';
  const topicQuestions =
    topics.find(([topic]) => topic === currentTopic)?.[1] || [];
  const selectedQuestion = useMemo(
    () =>
      questions.find((item) => item._id === selectedQuestionId) ||
      topicQuestions[0],
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
    setNotice(null);
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
      setNotice(null);
      const result = await submitMutation.mutateAsync({
        questionId: selectedQuestion._id,
        answer: values.answer
      });
      reset({ answer: '' });
      setNotice(
        result?.attempt?.status === 'reviewed'
          ? {
              tone: 'success',
              title: 'Answer reviewed',
              message:
                'Personalized feedback and a score were added to this attempt.'
            }
          : {
              tone: 'warning',
              title: 'Answer saved',
              message:
                'Detailed feedback is temporarily unavailable. Your answer and comparison were saved.'
            }
      );
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  const retryReview = async (attemptId) => {
    try {
      setRetryingId(attemptId);
      setNotice(null);
      const result = await retryMutation.mutateAsync(attemptId);
      setNotice(
        result?.attempt?.status === 'reviewed'
          ? {
              tone: 'success',
              title: 'Review completed',
              message: 'Feedback was added to your saved attempt.'
            }
          : {
              tone: 'warning',
              title: 'Review still unavailable',
              message:
                'Your original answer remains saved, and no extra attempt was used.'
            }
      );
    } catch (err) {
      setError('root', { message: err.message });
    } finally {
      setRetryingId(null);
    }
  };

  if (questionsQuery.isLoading || attemptsQuery.isLoading) {
    return <Loader label="Loading interview practice..." />;
  }

  if (questionsQuery.isError || attemptsQuery.isError) {
    return (
      <EmptyState
        title="Interview practice could not load"
        description={
          questionsQuery.error?.message ||
          attemptsQuery.error?.message ||
          'Try refreshing the page.'
        }
      />
    );
  }

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Interview practice"
        eyebrowIcon={BriefcaseBusiness}
        title="Build stronger coding answers"
        description="Practise questions by topic, compare your answer with an example, and improve across two attempts."
      />

      {!questions.length ? (
        <EmptyState
          title="No interview questions available"
          description="Interview questions will appear here when they are added."
        />
      ) : (
        <>
          <Card className="shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong"
                  aria-hidden="true"
                >
                  <BookOpenCheck size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
                    Question bank
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    Choose a topic and question
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Expand a topic, then select the interview question you want to practise.
                  </p>
                </div>
              </div>
              <Badge variant="neutral">{questions.length} questions</Badge>
            </div>

            <div className="mt-5 space-y-2">
              {topics.map(([topic, list]) => {
                const open = currentTopic === topic;
                const topicAttempts = attempts.filter(
                  (attempt) => attempt.question?.topic === topic
                ).length;

                return (
                  <section
                    key={topic}
                    className={`overflow-hidden rounded-surface border transition-colors ${
                      open
                        ? 'border-primary/20 bg-primary-soft/20'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => chooseTopic(topic)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-primary-soft/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-soft"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{topic}</p>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                          {list.length} question{list.length === 1 ? '' : 's'} ·{' '}
                          {topicAttempts} saved attempt{topicAttempts === 1 ? '' : 's'}
                        </p>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
                          open ? 'rotate-180 text-primary-strong' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {open ? (
                      <div className="space-y-2 border-t border-border/70 bg-surface/70 p-3">
                        {list.map((question) => {
                          const active = selectedQuestion?._id === question._id;
                          const questionAttempts = attempts.filter(
                            (attempt) => attempt.question?._id === question._id
                          ).length;

                          return (
                            <button
                              key={question._id}
                              type="button"
                              onClick={() => chooseQuestion(question._id)}
                              aria-pressed={active}
                              className={`w-full rounded-surface border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-soft ${
                                active
                                  ? 'border-primary/30 bg-primary-soft/70 shadow-sm'
                                  : 'border-border bg-surface hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={active ? 'info' : 'neutral'}>
                                  {question.difficulty}
                                </Badge>
                                <Badge variant="neutral">
                                  {formatQuestionType(question.type)}
                                </Badge>
                                <span className="ml-auto text-xs font-semibold text-muted-foreground">
                                  {questionAttempts}/{MAX_ATTEMPTS} attempts
                                </span>
                              </div>
                              <p className="mt-2.5 font-semibold leading-6 text-foreground">
                                {question.question}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </Card>

          <Card className="border-primary/10 bg-gradient-to-br from-surface via-surface to-primary-soft/20 shadow-sm">
            {selectedQuestion ? (
              <>
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong"
                    aria-hidden="true"
                  >
                    <MessageSquareText size={18} />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
                      Interview attempt
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-foreground">
                      Write your answer
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Structure your answer clearly, then submit it for review.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-panel border border-primary/10 bg-white/70 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{selectedQuestion.difficulty}</Badge>
                    <Badge variant="neutral">
                      {formatQuestionType(selectedQuestion.type)}
                    </Badge>
                    <Badge variant={canSubmit ? 'neutral' : 'warning'}>
                      {attemptsUsed}/{MAX_ATTEMPTS} attempts
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-7 text-foreground sm:text-xl">
                    {selectedQuestion.question}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Topic: {selectedQuestion.topic}
                  </p>
                </div>

                {notice ? (
                  <InlineAlert
                    className="mt-4"
                    tone={notice.tone}
                    title={notice.title}
                  >
                    {notice.message}
                  </InlineAlert>
                ) : null}
                <ErrorMessage message={errors.root?.message} />

                <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
                  {!canSubmit ? (
                    <InlineAlert tone="warning" title="Attempt limit reached">
                      You have used both attempts for this question. Review your
                      saved feedback and the example answer below instead.
                    </InlineAlert>
                  ) : null}

                  <FormTextarea
                    label="Your interview answer"
                    className="min-h-56"
                    placeholder="Use a clear structure: definition, small example, real project use, and one common mistake."
                    registration={register('answer')}
                    error={errors.answer?.message}
                    disabled={!canSubmit}
                  />

                  <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Your answer is saved before the review begins.
                    </p>
                    <Button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      isLoading={submitMutation.isPending}
                      loadingLabel="Saving and reviewing..."
                      className="shrink-0 gap-2"
                    >
                      <Send size={15} aria-hidden="true" />
                      Submit answer
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <EmptyState
                title="Choose a question"
                description="Select a topic and question to begin interview practice."
              />
            )}
          </Card>

          <Card className="shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong"
                  aria-hidden="true"
                >
                  <History size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
                    Practice history
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    Saved attempts & review
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Compare your attempts, review feedback, and use the example answer to improve.
                  </p>
                </div>
              </div>
              <Badge variant="neutral">
                {selectedAttempts.length}/{MAX_ATTEMPTS} attempts
              </Badge>
            </div>

            {selectedAttempts.length ? (
              <>
                <div className="mt-5 rounded-panel border border-primary/10 bg-primary-soft/35 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-surface text-primary-strong shadow-sm"
                      aria-hidden="true"
                    >
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Example answer</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {expectedAnswer ||
                          'The example answer is available in your saved feedback.'}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary-strong">
                        Unlocked after your first attempt
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
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
              <div className="mt-5">
                <EmptyState
                  title="No attempts yet"
                  description="Write your first answer to unlock the example answer and feedback history."
                />
              </div>
            )}
          </Card>
        </>
      )}
    </PageShell>
  );
}
