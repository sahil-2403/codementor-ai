import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useInterviewAttempts, useInterviewQuestions, useRetryInterviewReview, useSubmitInterviewAnswer } from '../../queries/interviewQueries.js';
import { interviewAnswerSchema } from '../../validations/interview.schema.js';

const MAX_ATTEMPTS = 2;

export default function InterviewPage() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [activeTab, setActiveTab] = useState('answer');
  const [notice, setNotice] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const questionsQuery = useInterviewQuestions();
  const attemptsQuery = useInterviewAttempts();
  const submitMutation = useSubmitInterviewAnswer();
  const retryMutation = useRetryInterviewReview();
  const { register, handleSubmit, reset, clearErrors, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(interviewAnswerSchema),
    defaultValues: { answer: '' }
  });

  const questions = questionsQuery.data?.questions || [];
  const attempts = attemptsQuery.data?.attempts || [];
  const topics = useMemo(() => Object.entries(questions.reduce((groups, question) => {
    groups[question.topic] = groups[question.topic] || [];
    groups[question.topic].push(question);
    return groups;
  }, {})), [questions]);
  const currentTopic = selectedTopic || topics[0]?.[0] || '';
  const topicQuestions = topics.find(([topic]) => topic === currentTopic)?.[1] || [];
  const selectedQuestion = useMemo(
    () => questions.find((item) => item._id === selectedQuestionId) || topicQuestions[0],
    [questions, selectedQuestionId, topicQuestions]
  );
  const selectedAttempts = attempts.filter((attempt) => attempt.question?._id === selectedQuestion?._id);
  const attemptsUsed = selectedAttempts.length;
  const canSubmit = Boolean(selectedQuestion) && attemptsUsed < MAX_ATTEMPTS;
  const expectedAnswer = selectedAttempts[0]?.aiFeedback?.expectedAnswer || selectedAttempts[0]?.question?.expectedAnswer || '';

  const resetWorkspace = (tab = 'answer') => {
    setActiveTab(tab);
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
      const result = await submitMutation.mutateAsync({ questionId: selectedQuestion._id, answer: values.answer });
      reset({ answer: '' });
      setActiveTab('attempts');
      setNotice(result?.attempt?.status === 'reviewed'
        ? { tone: 'success', title: 'Answer reviewed', message: 'Personalized feedback and a score were added to this attempt.' }
        : { tone: 'warning', title: 'Answer saved', message: 'Detailed feedback is temporarily unavailable. Your answer and comparison were saved.' });
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  const retryReview = async (attemptId) => {
    try {
      setRetryingId(attemptId);
      setNotice(null);
      const result = await retryMutation.mutateAsync(attemptId);
      setNotice(result?.attempt?.status === 'reviewed'
        ? { tone: 'success', title: 'Review completed', message: 'Feedback was added to your saved attempt.' }
        : { tone: 'warning', title: 'Review still unavailable', message: 'Your original answer remains saved, and no extra attempt was used.' });
    } catch (err) {
      setError('root', { message: err.message });
    } finally {
      setRetryingId(null);
    }
  };

  if (questionsQuery.isLoading || attemptsQuery.isLoading) return <Loader label="Loading interview practice..." />;
  if (questionsQuery.isError || attemptsQuery.isError) return <EmptyState title="Interview practice could not load" description={questionsQuery.error?.message || attemptsQuery.error?.message || 'Try refreshing the page.'} />;

  return <PageShell>
    <PageHeader
      eyebrow="Interview practice"
      title="Build stronger coding answers"
      description="Practise questions by topic, compare your answer with an example, and improve across two attempts."
    />

    {!questions.length ? <EmptyState title="No interview questions available" description="Interview questions will appear here when they are added." /> : <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-foreground">Question bank</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose a topic, then choose a question.</p>
          </div>
          <Badge>{questions.length} questions</Badge>
        </div>

        <div className="mt-5 space-y-3">
          {topics.map(([topic, list]) => {
            const open = currentTopic === topic;
            const topicAttempts = attempts.filter((attempt) => attempt.question?.topic === topic).length;
            return <section key={topic} className="rounded-[1.5rem] border border-border bg-surface p-4">
              <button type="button" onClick={() => chooseTopic(topic)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-soft">
                <div>
                  <p className="font-black text-foreground">{topic}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{list.length} question{list.length === 1 ? '' : 's'} · {topicAttempts} saved attempt{topicAttempts === 1 ? '' : 's'}</p>
                </div>
                <Badge variant={open ? 'info' : 'neutral'}>{open ? 'Open' : 'View'}</Badge>
              </button>

              {open ? <div className="mt-4 space-y-2">
                {list.map((question) => {
                  const active = selectedQuestion?._id === question._id;
                  const questionAttempts = attempts.filter((attempt) => attempt.question?._id === question._id).length;
                  return <button
                    key={question._id}
                    type="button"
                    onClick={() => chooseQuestion(question._id)}
                    aria-pressed={active}
                    className={`w-full rounded-2xl border p-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-soft ${active ? 'border-primary bg-primary text-white' : 'border-border bg-surface-secondary text-foreground hover:border-primary/30 hover:bg-primary-soft'}`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className="rounded-full bg-white/15 px-2 py-1 capitalize">{question.difficulty}</span>
                      <span className="rounded-full bg-white/15 px-2 py-1 capitalize">{String(question.type).replaceAll('_', ' ')}</span>
                      <span className="ml-auto">{questionAttempts}/{MAX_ATTEMPTS} attempts</span>
                    </div>
                    <p className="mt-2 font-bold leading-6">{question.question}</p>
                  </button>;
                })}
              </div> : null}
            </section>;
          })}
        </div>
      </Card>

      <Card>
        {selectedQuestion ? <>
          <div className="rounded-[1.5rem] bg-primary-soft p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{selectedQuestion.difficulty}</Badge>
              <Badge>{String(selectedQuestion.type).replaceAll('_', ' ')}</Badge>
              <Badge variant={canSubmit ? 'neutral' : 'warning'}>{attemptsUsed}/{MAX_ATTEMPTS} attempts</Badge>
            </div>
            <h2 className="mt-4 text-xl font-black leading-8 text-foreground">{selectedQuestion.question}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Topic: {selectedQuestion.topic}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Interview question workspace">
            <Button type="button" role="tab" aria-selected={activeTab === 'answer'} variant={activeTab === 'answer' ? 'primary' : 'secondary'} onClick={() => setActiveTab('answer')}>Write answer</Button>
            <Button type="button" role="tab" aria-selected={activeTab === 'attempts'} variant={activeTab === 'attempts' ? 'primary' : 'secondary'} onClick={() => setActiveTab('attempts')}>Saved attempts</Button>
            {selectedAttempts.length ? <Button type="button" role="tab" aria-selected={activeTab === 'expected'} variant={activeTab === 'expected' ? 'primary' : 'secondary'} onClick={() => setActiveTab('expected')}>Example answer</Button> : null}
          </div>

          {notice ? <InlineAlert className="mt-4" tone={notice.tone} title={notice.title}>{notice.message}</InlineAlert> : null}
          <ErrorMessage message={errors.root?.message} />

          {activeTab === 'answer' ? <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
            {!canSubmit ? <InlineAlert tone="warning" title="Attempt limit reached">You have used both attempts for this question. Review your saved feedback and the example answer instead.</InlineAlert> : null}
            <FormTextarea
              label="Your interview answer"
              className="min-h-64"
              placeholder="Use a clear structure: definition, small example, real project use, and one common mistake."
              registration={register('answer')}
              error={errors.answer?.message}
              disabled={!canSubmit}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Your answer is saved before the review begins.</p>
              <Button type="submit" disabled={!canSubmit || isSubmitting} isLoading={submitMutation.isPending} loadingLabel="Saving and reviewing...">Submit answer</Button>
            </div>
          </form> : null}

          {activeTab === 'attempts' ? <div className="mt-5 space-y-4">
            {selectedAttempts.length ? selectedAttempts.map((attempt, index) => <InterviewAttemptFeedback
              key={attempt._id}
              attempt={attempt}
              attemptNumber={selectedAttempts.length - index}
              isRetrying={retryingId === attempt._id}
              onRetry={() => retryReview(attempt._id)}
            />) : <EmptyState title="No attempts yet" description="Write your first answer to unlock the example answer and feedback history." />}
          </div> : null}

          {activeTab === 'expected' ? <div className="mt-5 rounded-[1.75rem] border border-border bg-surface-secondary p-5">
            <p className="font-black text-foreground">Example answer</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{expectedAnswer || 'The example answer is available in your saved feedback.'}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Unlocked after your first attempt</p>
          </div> : null}
        </> : <EmptyState title="Choose a question" description="Select a topic and question to begin interview practice." />}
      </Card>
    </div>}
  </PageShell>;
}
