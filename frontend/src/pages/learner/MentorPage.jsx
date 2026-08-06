import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUp, BookMarked, Bot, ChevronDown, FileText, Sparkles, User, WifiOff } from 'lucide-react';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import Loader from '../../components/common/Loader.jsx';
import { useAskMentor, useMentorHistory, useMentorSuggestions } from '../../queries/mentorQueries.js';
import { mentorAskSchema } from '../../validations/mentor.schema.js';
import { cn } from '../../utils/cn.js';

const sourceLabel = (source) => source?.title || source?.name || source?.refId || (typeof source === 'string' ? source : 'Learning source');

const promptOrder = ['simple_explanation', 'real_project_example', 'interview_answer', 'practice_question'];

const formatMessageTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function MentorMessageContent({ content = '' }) {
  const blocks = [];
  const pattern = /```([\w#+.-]+)?\s*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) blocks.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    blocks.push({ type: 'code', language: match[1] || 'code', value: match[2].trimEnd() });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) blocks.push({ type: 'text', value: content.slice(lastIndex) });
  if (!blocks.length) blocks.push({ type: 'text', value: content });

  return <div className="space-y-3">
    {blocks.map((block, index) => block.type === 'code' ? <div key={`${block.type}-${index}`} className="overflow-hidden rounded-control bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-slate-400">{block.language}</div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6"><code>{block.value}</code></pre>
    </div> : <p key={`${block.type}-${index}`} className="whitespace-pre-line">{block.value}</p>)}
  </div>;
}

function MentorMessage({ message }) {
  const isUser = message.role === 'user';
  const isSaved = message.metadata?.promptType === 'saved_answer';
  const time = formatMessageTime(message.createdAt);

  return <article className={cn('flex gap-3', isUser && 'flex-row-reverse')} aria-label={isUser ? 'Your message' : isSaved ? 'Saved course explanation' : 'Mentor response'}>
    <span className={cn(
      'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-control border',
      isUser ? 'border-border bg-surface-secondary text-muted-foreground' : 'border-primary/20 bg-primary-soft text-primary-strong'
    )} aria-hidden="true">
      {isUser ? <User size={15} /> : <Bot size={15} />}
    </span>

    <div className={cn('min-w-0 max-w-[85ch] flex-1', isUser && 'flex flex-col items-end')}>
      <div className={cn('flex items-center gap-2 text-[11px] text-muted-foreground', isUser && 'flex-row-reverse')}>
        <span className="font-semibold text-foreground">{isUser ? 'You' : 'Mentor'}</span>
        {time && <span className="font-mono">{time}</span>}
        {isSaved && <span className="rounded-full bg-surface-secondary px-2 py-0.5 font-semibold">Saved answer</span>}
      </div>

      <div className={cn(
        'mt-1.5 max-w-full rounded-panel px-4 py-3 text-sm leading-7',
        isUser ? 'bg-primary text-white shadow-sm' : 'border border-border bg-surface text-foreground shadow-sm'
      )}>
        <MentorMessageContent content={message.content} />
      </div>

      {!isUser && message.sources?.length ? <div className="mt-2 flex flex-wrap gap-1.5">
        {message.sources.map((source, index) => <span key={`${sourceLabel(source)}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-strong">
          <FileText size={12} aria-hidden="true" />
          {sourceLabel(source)}
        </span>)}
      </div> : null}
    </div>
  </article>;
}

function MentorConversation({ messages, isResponding, aiAvailable, savedQuestions, onSavedAnswer }) {
  const endRef = useRef(null);
  const shouldFollowRef = useRef(true);

  useEffect(() => {
    const updateFollowState = () => {
      const documentHeight = document.documentElement.scrollHeight;
      shouldFollowRef.current = window.scrollY + window.innerHeight >= documentHeight - 180;
    };

    updateFollowState();
    window.addEventListener('scroll', updateFollowState, { passive: true });
    return () => window.removeEventListener('scroll', updateFollowState);
  }, []);

  useEffect(() => {
    if (shouldFollowRef.current) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isResponding]);

  return <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6" aria-label="Mentor conversation" aria-live="polite">
    {messages.length ? <div className="space-y-7">
      {messages.map((message, index) => <MentorMessage key={message._id || message.clientId || `${message.role}-${index}`} message={message} />)}
      {isResponding && <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
        <span className="grid h-8 w-8 place-items-center rounded-control border border-primary/20 bg-primary-soft text-primary-strong" aria-hidden="true"><Bot size={15} /></span>
        <span className="animate-pulse">Mentor is preparing a response…</span>
      </div>}
    </div> : <div className="grid min-h-[360px] place-items-center rounded-panel border border-dashed border-border bg-surface-secondary/55 px-6 py-16 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-control border border-primary/20 bg-primary-soft text-primary-strong" aria-hidden="true"><Bot size={20} /></span>
        <p className="mt-4 text-sm font-semibold text-foreground">Ask anything about your learning</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">The mentor can use your active roadmap, current lesson, recent quiz mistakes, and weak topics to make the answer more relevant.</p>
      </div>
    </div>}

    {!aiAvailable && savedQuestions.length ? <section className="mt-8" aria-labelledby="saved-answers-title">
      <div className="flex items-center gap-2">
        <BookMarked size={17} className="text-primary" aria-hidden="true" />
        <h2 id="saved-answers-title" className="text-sm font-bold text-foreground">Saved answers for this learning context</h2>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {savedQuestions.map((item, index) => <button
          key={`${item.text || item.label}-${index}`}
          type="button"
          onClick={() => onSavedAnswer(item)}
          className="rounded-panel border border-border bg-surface p-4 text-left transition hover:border-primary/35 hover:shadow-sm focus-visible:ring-4 focus-visible:ring-primary-soft"
        >
          <p className="text-sm font-semibold text-foreground">{item.label || item.text}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Open the saved course explanation in this conversation.</p>
        </button>)}
      </div>
    </section> : null}

    <div ref={endRef} />
  </section>;
}

function MentorComposer({ aiAvailable, suggestions, isPending, register, errors, handleSubmit, onSubmit, onPrompt }) {
  const orderedSuggestions = useMemo(() => promptOrder
    .map((type) => suggestions.find((item) => item.promptType === type))
    .filter(Boolean), [suggestions]);

  return <div className="sticky bottom-0 z-30 border-t border-border bg-page/95 backdrop-blur-xl">
    <div className="mx-auto max-w-4xl px-4 py-3.5 sm:px-6">
      {aiAvailable && orderedSuggestions.length ? <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {orderedSuggestions.map((item) => <button
          key={item.promptType}
          type="button"
          disabled={isPending}
          onClick={() => onPrompt(item)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/35 hover:text-foreground disabled:opacity-55"
        >
          <Sparkles size={12} className="text-primary" aria-hidden="true" />
          {item.label}
        </button>)}
      </div> : null}

      <form onSubmit={handleSubmit(onSubmit)} className={cn(
        'rounded-panel border bg-surface p-2 shadow-sm transition focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary-soft',
        errors.message ? 'border-error' : 'border-border',
        !aiAvailable && 'bg-surface-secondary'
      )}>
        <textarea
          rows={2}
          className="min-h-[72px] w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/70 disabled:text-muted-foreground"
          placeholder={aiAvailable ? 'Ask about your lesson, quiz mistakes, or paste code to review…' : 'Free-form questions are unavailable. Choose a saved answer above.'}
          aria-invalid={Boolean(errors.message)}
          disabled={!aiAvailable || isPending}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          {...register('message')}
        />

        <div className="flex items-center justify-between gap-3 border-t border-border px-1 pt-2">
          <label className="relative inline-flex items-center text-xs text-muted-foreground">
            <span className="sr-only">Answer style</span>
            <select
              className="appearance-none rounded-full border border-border bg-surface py-1.5 pl-3 pr-8 font-semibold text-foreground outline-none transition hover:border-primary/35 focus:border-primary disabled:bg-surface-secondary disabled:text-muted-foreground"
              disabled={!aiAvailable || isPending}
              {...register('promptType')}
            >
              <option value="freeform">Direct answer</option>
              <option value="simple_explanation">Simple explanation</option>
              <option value="real_project_example">Project example</option>
              <option value="interview_answer">Interview answer</option>
              <option value="practice_question">Practice question</option>
              <option value="revision_notes">Revision notes</option>
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5" aria-hidden="true" />
          </label>

          <button
            type="submit"
            disabled={!aiAvailable || isPending}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-primary text-white shadow-sm transition hover:bg-primary-strong disabled:bg-surface-secondary disabled:text-muted-foreground"
            aria-label={isPending ? 'Preparing response' : aiAvailable ? 'Send message' : 'Mentor unavailable'}
          >
            {isPending ? <span className="ui-spinner ui-spinner--sm" aria-hidden="true" /> : aiAvailable ? <ArrowUp size={17} /> : <WifiOff size={16} />}
          </button>
        </div>
      </form>

      {errors.message && <p className="mt-2 text-xs font-semibold text-error">{errors.message.message}</p>}
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{aiAvailable
        ? 'Answers use your lesson, quiz history, and flagged weak topics as context.'
        : 'Saved explanations from your course remain available while live mentor responses are unavailable.'}</p>
    </div>
  </div>;
}

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
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(mentorAskSchema),
    defaultValues: { message: '', promptType: 'freeform' }
  });

  const historyMessages = useMemo(() => historyQuery.data?.chats?.[0]?.messages || [], [historyQuery.data]);
  const messages = useMemo(() => [...historyMessages, ...localMessages], [historyMessages, localMessages]);
  const suggestions = suggestionsQuery.data?.prompts || [];
  const savedQuestions = fallbackQuestions.length ? fallbackQuestions : suggestionsQuery.data?.savedQuestions || [];
  const context = suggestionsQuery.data?.context || {};
  const latestMessageContext = useMemo(() => [...historyMessages].reverse().find((message) => message.role === 'assistant' && (message.metadata?.lessonTitle || message.metadata?.moduleTitle))?.metadata || {}, [historyMessages]);
  const aiAvailable = suggestionsQuery.data?.aiAvailable === true && !providerNotice;
  const contextLabel = [
    context.courseTitle || 'Active roadmap',
    context.lessonTitle || latestMessageContext.lessonTitle || context.moduleTitle || latestMessageContext.moduleTitle || (lessonId ? 'Current lesson' : 'Your learning path')
  ].filter(Boolean).join(' · ');

  const addSavedAnswer = useCallback((item) => {
    if (!item) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();
    setLocalMessages((current) => [...current,
      { clientId: `${id}-q`, role: 'user', content: item.text, createdAt, metadata: { promptType: 'saved_answer' } },
      { clientId: `${id}-a`, role: 'assistant', content: item.answer, createdAt, sources: [], metadata: { promptType: 'saved_answer' } }
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
        setProviderNotice(result.message || 'Live mentor responses are temporarily unavailable.');
        setFallbackQuestions(result.savedQuestions || []);
        setLocalMessages((current) => [...current, {
          clientId: `unanswered-${Date.now()}`,
          role: 'user',
          content: message,
          createdAt: new Date().toISOString(),
          metadata: { promptType: type }
        }]);
        reset({ message: '', promptType: 'freeform' });
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

  if (historyQuery.isLoading || suggestionsQuery.isLoading) return <Loader label="Loading mentor..." />;

  return <section className="-mx-4 -my-8 flex min-h-[calc(100vh-4rem)] flex-col bg-page sm:-mx-6 lg:-mx-8">
    <header className="sticky top-16 z-30 border-b border-border bg-page/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control border border-primary/20 bg-primary-soft text-primary-strong" aria-hidden="true"><Bot size={17} /></span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-foreground">AI Mentor</h1>
            <p className="truncate text-xs text-muted-foreground">{contextLabel}</p>
          </div>
        </div>

        <span className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
          aiAvailable ? 'border-success/20 bg-success-soft text-success' : 'border-warning/20 bg-warning-soft text-warning'
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', aiAvailable ? 'bg-success' : 'bg-warning')} aria-hidden="true" />
          {aiAvailable ? 'Online' : 'Saved answers'}
        </span>
      </div>
    </header>

    <div className="mx-auto w-full max-w-4xl space-y-3 px-4 pt-4 sm:px-6">
      {historyQuery.error && <InlineAlert tone="danger" title="Previous conversations are unavailable">{historyQuery.error.message} <button type="button" className="font-semibold underline" onClick={() => historyQuery.refetch()}>Try again</button></InlineAlert>}
      {suggestionsQuery.error && <InlineAlert tone="danger" title="Mentor context is unavailable">{suggestionsQuery.error.message} <button type="button" className="font-semibold underline" onClick={() => suggestionsQuery.refetch()}>Try again</button></InlineAlert>}
      {(providerNotice || (!aiAvailable && !suggestionsQuery.error)) && <InlineAlert tone="warning" title="Live mentor responses are unavailable">{providerNotice || 'You can still open saved explanations from your course.'}</InlineAlert>}
      <ErrorMessage message={errors.root?.message || askMutation.error?.message} />
    </div>

    <MentorConversation
      messages={messages}
      isResponding={askMutation.isPending}
      aiAvailable={aiAvailable}
      savedQuestions={savedQuestions}
      onSavedAnswer={addSavedAnswer}
    />

    <MentorComposer
      aiAvailable={aiAvailable}
      suggestions={suggestions}
      isPending={askMutation.isPending}
      register={register}
      errors={errors}
      handleSubmit={handleSubmit}
      onSubmit={(values) => sendPayload({ text: values.message, type: values.promptType })}
      onPrompt={(item) => sendPayload({ text: item.text, type: item.promptType })}
    />
  </section>;
}
