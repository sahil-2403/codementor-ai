import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import FormTextarea from '../../components/form/FormTextarea.jsx';
import { useInterviewAttempts, useInterviewQuestions, useSubmitInterviewAnswer } from '../../queries/interviewQueries.js';
import { interviewAnswerSchema } from '../../validations/interview.schema.js';

export default function InterviewPage() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [activeTab, setActiveTab] = useState('answer');
  const { data, isLoading } = useInterviewQuestions();
  const { data: attemptsData } = useInterviewAttempts();
  const submitMutation = useSubmitInterviewAnswer();
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(interviewAnswerSchema),
    defaultValues: { answer: '' }
  });
  const questions = data?.questions || [];
  const attempts = attemptsData?.attempts || [];
  const topics = useMemo(() => Object.entries(questions.reduce((acc, q) => {
    acc[q.topic] = acc[q.topic] || [];
    acc[q.topic].push(q);
    return acc;
  }, {})), [questions]);
  const currentTopic = selectedTopic || topics[0]?.[0] || '';
  const topicQuestions = topics.find(([topic]) => topic === currentTopic)?.[1] || [];
  const selectedQuestion = useMemo(() => questions.find((item) => item._id === selectedQuestionId) || topicQuestions[0], [questions, selectedQuestionId, topicQuestions]);
  const selectedAttempts = attempts.filter((attempt) => attempt.question?._id === selectedQuestion?._id);
  const attemptsUsed = selectedAttempts.length;
  const canSubmit = selectedQuestion && attemptsUsed < 2;

  const chooseTopic = (topic) => {
    setSelectedTopic(topic);
    const first = topics.find(([name]) => name === topic)?.[1]?.[0];
    setSelectedQuestionId(first?._id || '');
    setActiveTab('answer');
  };

  const chooseQuestion = (questionId) => {
    setSelectedQuestionId(questionId);
    setActiveTab('answer');
  };

  const submit = async (values) => {
    if (!selectedQuestion?._id) return;
    try {
      await submitMutation.mutateAsync({ questionId: selectedQuestion._id, answer: values.answer });
      reset();
      setActiveTab('attempts');
    } catch (err) { setError('root', { message: err.message }); }
  };

  if (isLoading) return <Loader label="Loading interview mode..." />;

  return <div className="space-y-6">
    <Card>
      <Badge>Interview mode</Badge>
      <h1 className="mt-3 text-4xl font-black text-slate-950">Coding Interview Practice</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Practice by topic, submit up to two answers per question, and compare with expected answers when AI feedback is unavailable.</p>
    </Card>

    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <h2 className="text-xl font-black">Question bank by topic</h2>
        <div className="mt-4 space-y-3">
          {topics.map(([topic, list]) => {
            const topicAttempts = attempts.filter((attempt) => attempt.question?.topic === topic).length;
            return <div key={topic} className="rounded-3xl border border-slate-100 bg-white/70 p-4">
              <button onClick={() => chooseTopic(topic)} className="flex w-full items-center justify-between text-left">
                <div><p className="font-black text-slate-950">{topic}</p><p className="text-sm text-slate-500">{list.length} question(s) · {topicAttempts} attempt(s)</p></div>
                <Badge>{currentTopic === topic ? 'Open' : 'View'}</Badge>
              </button>
              {currentTopic === topic && <div className="mt-4 space-y-2">
                {list.map((question) => <button key={question._id} onClick={() => chooseQuestion(question._id)} className={`w-full rounded-2xl p-3 text-left text-sm transition ${selectedQuestion?._id === question._id ? 'bg-slate-950 text-white' : 'bg-slate-50 hover:bg-indigo-50'}`}>
                  <div className="flex flex-wrap gap-2"><span className="rounded-full bg-white/20 px-2 py-1 text-xs font-bold">{question.difficulty}</span><span className="rounded-full bg-white/20 px-2 py-1 text-xs font-bold">{question.type}</span></div>
                  <p className="mt-2 font-bold">{question.question}</p>
                </button>)}
              </div>}
            </div>;
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black">Answer practice</h2>
        {selectedQuestion ? <>
          <div className="mt-4 rounded-3xl bg-indigo-50 p-5">
            <div className="flex flex-wrap gap-2"><Badge>{selectedQuestion.difficulty}</Badge><Badge>{selectedQuestion.type}</Badge><Badge>{attemptsUsed}/2 attempts</Badge></div>
            <p className="mt-3 text-lg font-black text-slate-950">{selectedQuestion.question}</p>
            <p className="mt-2 text-sm text-slate-600">Topic: {selectedQuestion.topic}</p>
          </div>
          <div className="mt-4 flex gap-2"><Button variant={activeTab === 'answer' ? 'primary' : 'secondary'} onClick={() => setActiveTab('answer')}>Answer</Button><Button variant={activeTab === 'attempts' ? 'primary' : 'secondary'} onClick={() => setActiveTab('attempts')}>My attempts</Button><Button variant={activeTab === 'expected' ? 'primary' : 'secondary'} onClick={() => setActiveTab('expected')}>Expected answer</Button></div>
          <ErrorMessage message={errors.root?.message} />
          {activeTab === 'answer' && <form onSubmit={handleSubmit(submit)} className="mt-4 space-y-4">
            {!canSubmit && <p className="rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-700">You have used both attempts for this question.</p>}
            <FormTextarea className="min-h-56" placeholder="Write your interview answer here. Try: definition → example → project use case → common mistake." registration={register('answer')} error={errors.answer?.message} disabled={!canSubmit} />
            <Button disabled={!canSubmit || isSubmitting || submitMutation.isPending}>{submitMutation.isPending ? 'Reviewing...' : 'Submit answer'}</Button>
          </form>}
          {activeTab === 'attempts' && <div className="mt-4 space-y-4">{selectedAttempts.length ? selectedAttempts.map((attempt, index) => {
            const fallback = attempt.feedbackMode === 'fallback' || attempt.score === null;
            return <div key={attempt._id} className="rounded-3xl border border-slate-100 bg-white/70 p-4">
              <div className="flex items-center justify-between"><p className="font-black">Attempt {selectedAttempts.length - index}</p>{!fallback && <Badge>{attempt.score}%</Badge>}</div>
              <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{attempt.answer}</p>
              <div className={`mt-3 rounded-2xl p-3 text-sm leading-6 ${fallback ? 'bg-amber-50 text-amber-900' : 'bg-cyan-50 text-slate-800'}`}>
                {fallback && <p className="mb-2 font-black">AI feedback is currently unavailable. Compare your answer with the expected answer and improve the structure.</p>}
                <p className="font-black">Expected answer</p><p>{attempt.aiFeedback?.expectedAnswer || attempt.question?.expectedAnswer}</p>
                <p className="mt-2 font-black">Improvements</p><ul className="list-disc pl-5">{attempt.aiFeedback?.improvements?.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>;
          }) : <p className="text-sm text-slate-500">No attempts for this question yet.</p>}</div>}
          {activeTab === 'expected' && <div className="mt-4 rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-700"><p className="font-black text-slate-950">Expected answer</p><p className="mt-2">{selectedQuestion.expectedAnswer}</p></div>}
        </> : <p className="mt-4 text-sm text-slate-500">No questions found.</p>}
      </Card>
    </div>
  </div>;
}
