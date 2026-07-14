import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Badge from '../../components/common/Badge.jsx';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import ChatWindow from '../../components/mentor/ChatWindow.jsx';
import FormSelect from '../../components/form/FormSelect.jsx';
import FormInput from '../../components/form/FormInput.jsx';
import { useAskMentor, useMentorHistory, useMentorSuggestions } from '../../queries/mentorQueries.js';
import { mentorAskSchema } from '../../validations/mentor.schema.js';

export default function MentorPage() {
  const [params] = useSearchParams();
  const lessonId = params.get('lessonId');
  const autoSend = params.get('autoSend') === 'true';
  const autoPromptType = params.get('promptType') || 'simple_explanation';
  const { data } = useMentorHistory();
  const { data: suggestionData } = useMentorSuggestions(lessonId);
  const askMutation = useAskMentor();
  const [localMessages, setLocalMessages] = useState([]);
  const [autoSent, setAutoSent] = useState(false);
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(mentorAskSchema),
    defaultValues: { message: '', promptType: 'freeform' }
  });
  const historyMessages = useMemo(() => data?.chats?.[0]?.messages || [], [data]);
  const messages = localMessages.length ? [...historyMessages, ...localMessages] : historyMessages;
  const suggestions = suggestionData?.prompts || [];
  const savedQuestions = suggestionData?.savedQuestions || [];
  const aiAvailable = suggestionData?.aiAvailable === true;

  const addSavedAnswer = (item) => {
    setLocalMessages((prev) => [...prev, { role: 'user', content: item.text, metadata: { promptType: 'saved_answer' } }, { role: 'assistant', content: item.answer, sources: [], metadata: { promptType: 'saved_answer' } }]);
  };

  const sendPayload = async ({ text, type = 'freeform' }) => {
    if (!text.trim()) return;
    if (!aiAvailable) {
      const match = savedQuestions.find((item) => item.promptType === type || item.text === text) || savedQuestions[0];
      if (match) addSavedAnswer(match);
      return;
    }
    try {
      const userMessage = { role: 'user', content: text, metadata: { promptType: type } };
      setLocalMessages((prev) => [...prev, userMessage]);
      const result = await askMutation.mutateAsync({ message: text, lessonId: lessonId || undefined, promptType: type });
      setLocalMessages((prev) => [...prev, { role: 'assistant', content: result.answer, sources: result.sources, metadata: result.contextSummary }]);
      reset({ message: '', promptType: 'freeform' });
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  useEffect(() => {
    if (!autoSend || autoSent || !suggestions.length) return;
    const prompt = suggestions.find((item) => item.promptType === autoPromptType) || suggestions[0];
    if (prompt) {
      setAutoSent(true);
      sendPayload({ text: prompt.text, type: prompt.promptType });
    }
  }, [autoSend, autoSent, autoPromptType, suggestions]);

  const send = async (values) => sendPayload({ text: values.message, type: values.promptType });

  return <div className="mx-auto max-w-6xl space-y-5">
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge>{aiAvailable ? 'Contextual AI' : 'Saved explanations'}</Badge>
          <h1 className="mt-3 text-3xl font-black">AI Mentor</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Ask coding doubts with lesson, roadmap, quiz mistakes, weak topics, and course context when AI is available. When AI is unavailable, use saved course explanations.</p>
        </div>
      </div>
    </Card>

    {!aiAvailable && <InlineAlert tone="warning" title="AI mentor is currently unavailable">Freeform chat is disabled. You can still open saved explanations from your current lesson or learning path below.</InlineAlert>}

    <Card>
      <h2 className="text-lg font-black">{aiAvailable ? 'Suggested prompts' : 'Saved question answers'}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {aiAvailable ? suggestions.map((item) => <button key={item.promptType} onClick={() => sendPayload({ text: item.text, type: item.promptType })} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700" disabled={askMutation.isPending}>{item.label}</button>) : savedQuestions.map((item) => <button key={item.label} onClick={() => addSavedAnswer(item)} className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-100">{item.label}</button>)}
      </div>
    </Card>

    <ErrorMessage message={errors.root?.message} />
    <ChatWindow messages={messages} />
    <form onSubmit={handleSubmit(send)} className="sticky bottom-4 grid gap-3 rounded-[2rem] border border-slate-100 bg-white/90 p-3 shadow-soft backdrop-blur md:grid-cols-[240px_1fr_auto]">
      <FormSelect label="Prompt type" error={errors.promptType?.message} {...register('promptType')} disabled={!aiAvailable}>
        <option value="freeform">Freeform</option>
        <option value="simple_explanation">Simple explanation</option>
        <option value="real_project_example">Real project example</option>
        <option value="interview_answer">Interview answer</option>
        <option value="practice_question">Practice question</option>
        <option value="revision_notes">Revision notes</option>
      </FormSelect>
      <FormInput label="Ask your doubt" placeholder={aiAvailable ? 'Ask your doubt...' : 'AI chat unavailable. Use saved explanations above.'} registration={register('message')} error={errors.message?.message} disabled={!aiAvailable} />
      <div className="flex items-end"><Button className="h-[58px] w-full px-7" disabled={!aiAvailable || askMutation.isPending}>{askMutation.isPending ? 'Thinking...' : 'Send'}</Button></div>
    </form>
  </div>;
}
