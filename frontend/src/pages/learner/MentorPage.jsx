import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpenCheck, ShieldCheck } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Badge from '../../components/common/Badge.jsx';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import ChatWindow from '../../components/mentor/ChatWindow.jsx';
import MentorPrompts from '../../components/mentor/MentorPrompts.jsx';
import FormSelect from '../../components/form/FormSelect.jsx';
import { useAskMentor, useMentorHistory, useMentorSuggestions } from '../../queries/mentorQueries.js';
import { mentorAskSchema } from '../../validations/mentor.schema.js';

export default function MentorPage() {
  const [params] = useSearchParams();
  const lessonId = params.get('lessonId');
  const autoSend = params.get('autoSend') === 'true';
  const autoPromptType = params.get('promptType') || 'simple_explanation';
  const historyQuery = useMentorHistory();
  const suggestionsQuery = useMentorSuggestions(lessonId);
  const askMutation = useAskMentor();
  const [localMessages, setLocalMessages] = useState([]);
  const [autoSent, setAutoSent] = useState(false);
  const [providerNotice, setProviderNotice] = useState('');
  const [fallbackQuestions, setFallbackQuestions] = useState([]);
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({ resolver: zodResolver(mentorAskSchema), defaultValues: { message: '', promptType: 'freeform' } });

  const historyMessages = useMemo(() => historyQuery.data?.chats?.[0]?.messages || [], [historyQuery.data]);
  const messages = useMemo(() => [...historyMessages, ...localMessages], [historyMessages, localMessages]);
  const suggestions = suggestionsQuery.data?.prompts || [];
  const savedQuestions = fallbackQuestions.length ? fallbackQuestions : suggestionsQuery.data?.savedQuestions || [];
  const aiAvailable = suggestionsQuery.data?.aiAvailable === true && !providerNotice;

  const addSavedAnswer = useCallback((item) => {
    if (!item) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setLocalMessages((current) => [...current,
      { clientId: `${id}-q`, role: 'user', content: item.text, metadata: { promptType: 'saved_answer' } },
      { clientId: `${id}-a`, role: 'assistant', content: item.answer, sources: [], metadata: { promptType: 'saved_answer' } }
    ]);
  }, []);

  const sendPayload = useCallback(async ({ text, type = 'freeform' }) => {
    const message = text.trim();
    if (!message) return;
    if (!aiAvailable) {
      addSavedAnswer(savedQuestions.find((item) => item.promptType === type || item.text === message) || savedQuestions[0]);
      return;
    }
    try {
      setProviderNotice('');
      const result = await askMutation.mutateAsync({ message, lessonId: lessonId || undefined, promptType: type });
      if (result?.aiAvailable === false) {
        setProviderNotice(result.message || 'Gemini mentor is temporarily unavailable.');
        setFallbackQuestions(result.savedQuestions || []);
        setLocalMessages((current) => [...current, { clientId: `unanswered-${Date.now()}`, role: 'user', content: message, metadata: { promptType: type } }]);
        return;
      }
      reset({ message: '', promptType: 'freeform' });
    } catch (err) {
      setError('root', { message: err?.message || 'Could not send your mentor question.' });
    }
  }, [addSavedAnswer, aiAvailable, askMutation, lessonId, reset, savedQuestions, setError]);

  useEffect(() => {
    if (!autoSend || autoSent || suggestionsQuery.isLoading || (!suggestions.length && !savedQuestions.length)) return;
    setAutoSent(true);
    const prompt = suggestions.find((item) => item.promptType === autoPromptType) || suggestions[0];
    const saved = savedQuestions.find((item) => item.promptType === autoPromptType) || savedQuestions[0];
    if (aiAvailable && prompt) sendPayload({ text: prompt.text, type: prompt.promptType });
    else addSavedAnswer(saved);
  }, [addSavedAnswer, aiAvailable, autoPromptType, autoSend, autoSent, savedQuestions, sendPayload, suggestions, suggestionsQuery.isLoading]);

  if (historyQuery.isLoading || suggestionsQuery.isLoading) return <Loader label="Loading mentor workspace..." />;
  const promptItems = aiAvailable ? suggestions : savedQuestions;

  return <PageShell>
    <PageHeader eyebrow="Context-aware mentoring" title="CodeMentor" description="Ask with trusted roadmap, lesson, weak-topic, and recent-mistake context when Gemini is available. Saved course explanations remain clearly separate." actions={<Badge variant={aiAvailable ? 'info' : 'warning'}>{aiAvailable ? 'Gemini available' : 'Saved explanations only'}</Badge>} />

    {historyQuery.error && <InlineAlert tone="danger" title="Conversation history is unavailable">{historyQuery.error.message} <button type="button" className="font-semibold underline" onClick={() => historyQuery.refetch()}>Retry</button></InlineAlert>}
    {suggestionsQuery.error && <InlineAlert tone="danger" title="Mentor suggestions are unavailable">{suggestionsQuery.error.message} <button type="button" className="font-semibold underline" onClick={() => suggestionsQuery.refetch()}>Retry</button></InlineAlert>}
    {(providerNotice || !aiAvailable) && <InlineAlert tone="warning" title="Freeform mentor chat is unavailable">{providerNotice || 'Gemini is not configured or enabled. Open a saved explanation from published course content instead.'}</InlineAlert>}

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-5">
        <ChatWindow messages={messages} isResponding={askMutation.isPending} emptyMessage={aiAvailable ? 'Choose a suggested prompt or ask your first coding question.' : 'Choose a saved course explanation from the guidance panel.'} />
        <ErrorMessage message={errors.root?.message || askMutation.error?.message} />
        <form onSubmit={handleSubmit((values) => sendPayload({ text: values.message, type: values.promptType }))} className="rounded-panel border border-border bg-surface p-4 shadow-soft">
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <FormSelect label="Response mode" error={errors.promptType?.message} {...register('promptType')} disabled={!aiAvailable || askMutation.isPending}>
              <option value="freeform">Freeform</option><option value="simple_explanation">Simple explanation</option><option value="real_project_example">Real project example</option><option value="interview_answer">Interview answer</option><option value="practice_question">Practice question</option><option value="revision_notes">Revision notes</option>
            </FormSelect>
            <label className="block space-y-1.5"><span className="ui-field-label">Your question</span><textarea className="ui-field-control min-h-28 resize-y" placeholder={aiAvailable ? 'Describe the concept, code, or mistake you want help with.' : 'Freeform chat is unavailable. Use a saved explanation.'} aria-invalid={Boolean(errors.message)} disabled={!aiAvailable || askMutation.isPending} {...register('message')} />{errors.message && <span className="ui-field-error">{errors.message.message}</span>}</label>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-muted-foreground">Questions are sanitized and limited before trusted context is sent to Gemini.</p><Button type="submit" disabled={!aiAvailable} isLoading={askMutation.isPending} loadingLabel="Preparing response...">Send question</Button></div>
        </form>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Mentor guidance">
        <MentorPrompts aiAvailable={aiAvailable} items={promptItems} lessonScoped={Boolean(lessonId)} disabled={askMutation.isPending} onSelect={(item) => aiAvailable ? sendPayload({ text: item.text, type: item.promptType }) : addSavedAnswer(item)} />
        <Card><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-success" size={20} aria-hidden="true" /><div><h2 className="font-bold text-foreground">Trusted context only</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">The backend can use the active course, current module, lesson, weak topics, recent quiz mistakes, and retrieved learning sources.</p></div></div></Card>
        <Card><div className="flex items-start gap-3"><BookOpenCheck className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" /><div><h2 className="font-bold text-foreground">Saved explanations</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">These come from published lesson theory, interview Q&amp;A, or common mistakes. They are not labelled as Gemini responses.</p></div></div></Card>
      </aside>
    </div>
  </PageShell>;
}
