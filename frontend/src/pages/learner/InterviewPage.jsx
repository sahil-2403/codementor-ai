import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpenCheck,
  BriefcaseBusiness,
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
import InterviewQuestionSelector from '../../components/interview/InterviewQuestionSelector.jsx';
import { interviewApi } from '../../api/interviewApi.js';
import { interviewAnswerSchema } from '../../validations/interview.schema.js';

const MAX_ATTEMPTS = 2;

const formatQuestionType = (value) => String(value || '').replaceAll('_', ' ');

export default function InterviewPage() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [notice, setNotice] = useState(null);
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
    setError,
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
      const result = await interviewApi.submit({
        questionId: selectedQuestion._id,
        answer: values.answer
      });
      reset({ answer: '' });
      setLoadAttempt((value) => value + 1);
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
      const result = await interviewApi.retryReview(attemptId);
      setLoadAttempt((value) => value + 1);
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

  if (isLoading) {
    return <Loader label="Loading interview practice..." />;
  }

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
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true">
                  <BookOpenCheck size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Question bank</p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">Choose a topic and question</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Select a topic, then choose the interview question you want to practise.</p>
                </div>
              </div>
              <Badge variant="neutral">{questions.length} questions</Badge>
            </div>

            <InterviewQuestionSelector
              topics={topics}
              currentTopic={currentTopic}
              topicQuestions={topicQuestions}
              selectedQuestionId={selectedQuestion?._id || ''}
              onTopicChange={chooseTopic}
              onQuestionChange={chooseQuestion}
            />
          </Card>

          <Card className="border-primary/10 bg-gradient-to-br from-surface via-surface to-primary-soft/20 shadow-sm">
            {selectedQuestion ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true">
                    <MessageSquareText size={18} />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Interview attempt</p>
                    <h2 className="mt-1 text-xl font-bold text-foreground">Write your answer</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">Structure your answer clearly, then submit it for review.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-panel border border-primary/10 bg-white/70 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{selectedQuestion.difficulty}</Badge>
                    <Badge variant="neutral">{formatQuestionType(selectedQuestion.type)}</Badge>
                    <Badge variant={canSubmit ? 'neutral' : 'warning'}>{attemptsUsed}/{MAX_ATTEMPTS} attempts</Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-7 text-foreground sm:text-xl">{selectedQuestion.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Topic: {selectedQuestion.topic}</p>
                </div>

                {notice ? (
                  <InlineAlert className="mt-4" tone={notice.tone} title={notice.title}>{notice.message}</InlineAlert>
                ) : null}
                <ErrorMessage message={errors.root?.message} />

                <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
                  {!canSubmit ? (
                    <InlineAlert tone="warning" title="Attempt limit reached">
                      You have used both attempts for this question. Review your saved feedback and the example answer below instead.
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
                    <p className="text-sm text-muted-foreground">Your answer is saved before the review begins.</p>
                    <Button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      isLoading={isSubmitting}
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
              <EmptyState title="Choose a question" description="Select a topic and question to begin interview practice." />
            )}
          </Card>

          <Card className="shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true">
                  <History size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Practice history</p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">Saved attempts & review</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Compare your attempts, review feedback, and use the example answer to improve.</p>
                </div>
              </div>
              <Badge variant="neutral">{selectedAttempts.length}/{MAX_ATTEMPTS} attempts</Badge>
            </div>

            {selectedAttempts.length ? (
              <>
                <div className="mt-5 rounded-panel border border-primary/10 bg-primary-soft/35 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-surface text-primary-strong shadow-sm" aria-hidden="true">
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Example answer</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {expectedAnswer || 'The example answer is available in your saved feedback.'}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary-strong">Unlocked after your first attempt</p>
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
                <EmptyState title="No attempts yet" description="Write your first answer to unlock the example answer and feedback history." />
              </div>
            )}
          </Card>
        </>
      )}
    </PageShell>
  );
}
