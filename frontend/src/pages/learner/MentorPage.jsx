import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookMarked, Bot, FileText, SendHorizonal, Sparkles, User, WifiOff } from 'lucide-react';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import Loader from '../../components/common/Loader.jsx';
import {
  useAskMentor,
  useMentorAIStatus,
  useMentorHistory,
  useMentorSuggestions
} from '../../queries/mentorQueries.js';
import { mentorAskSchema } from '../../validations/mentor.schema.js';
import { cn } from '../../utils/cn.js';
import notify from '../../utils/notify.js';

const promptOrder = [
  'simple_explanation',
  'real_project_example',
  'interview_answer',
  'practice_question'
];

const sourceLabel = (source) =>
  source?.title || source?.name || source?.refId ||
  (typeof source === 'string' ? source : 'Learning source');

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatResetTime = (value) => {
  if (!value) return 'after the daily reset';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'after the daily reset';
  return date.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
};

const isDailyLimitError = (error) =>
  error?.code === 'AI_DAILY_LIMIT_REACHED' ||
  (error?.status === 429 && /daily.*limit|limit.*reached/i.test(error?.message || ''));

function MentorMessage({ message }) {
  const isUser = message.role === 'user';
  const isSaved = message.metadata?.promptType === 'saved_answer';
  const time = formatTime(message.createdAt);

  return (
    <article className={cn('flex w-full gap-2', isUser && 'flex-row-reverse')}>
      <span className={cn('mt-5 shrink-0', isUser ? 'text-muted-foreground' : 'text-primary-strong')} aria-hidden="true">
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </span>

      <div className={cn('min-w-0 max-w-[75%]', isUser && 'flex flex-col items-end')}>
        <div className={cn('flex items-center gap-2 text-[11px] text-muted-foreground', isUser && 'flex-row-reverse')}>
          <span className="font-semibold text-foreground">{isUser ? 'You' : 'Mentor'}</span>
          {time ? <span>{time}</span> : null}
          {isSaved ? <span className="rounded-full bg-surface-secondary px-2 py-0.5 font-semibold">Saved answer</span> : null}
        </div>

        <div className={cn(
          'mt-1.5 whitespace-pre-wrap break-words rounded-panel px-4 py-3 text-sm leading-7',
          isUser ? 'bg-primary text-white' : 'border border-border bg-surface text-foreground'
        )}>
          {String(message.content || '').trim()}
        </div>

        {!isUser && message.sources?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((source, index) => (
              <span
                key={`${sourceLabel(source)}-${index}`}
                className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-strong"
              >
                <FileText size={12} aria-hidden="true" />
                {sourceLabel(source)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SavedAnswers({ items, onSelect }) {
  if (!items.length) return null;

  return (
    <section className="mt-8" aria-labelledby="saved-answers-title">
      <div className="flex items-center gap-2">
        <BookMarked size={17} className="text-primary" aria-hidden="true" />
        <h2 id="saved-answers-title" className="text-sm font-bold text-foreground">
          Saved answers for this learning context
        </h2>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <button
            key={`${item.text || item.label}-${index}`}
            type="button"
            onClick={() => onSelect(item)}
            className="rounded-panel border border-border bg-surface p-4 text-left transition hover:border-primary/35 hover:shadow-sm"
          >
            <p className="text-sm font-semibold text-foreground">{item.label || item.text}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Open the saved course explanation.</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function MentorPage() {
  const [params, setParams] = useSearchParams();
  const lessonId = params.get('lessonId');
  const autoSend = params.get('autoSend') === 'true';
  const autoPromptType = params.get('promptType') || 'simple_explanation';

  const historyQuery = useMentorHistory();
  const suggestionsQuery = useMentorSuggestions(lessonId);
  const aiStatusQuery = useMentorAIStatus();
  const askMutation = useAskMentor();

  const [localMessages, setLocalMessages] = useState([]);
  const [providerNotice, setProviderNotice] = useState('');
  const [fallbackQuestions, setFallbackQuestions] = useState([]);
  const [limitReachedOverride, setLimitReachedOverride] = useState(false);
  const autoSentRef = useRef(false);
  const endRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(mentorAskSchema),
    defaultValues: { message: '', promptType: 'freeform' }
  });

  const historyMessages = useMemo(
    () => historyQuery.data?.chats?.[0]?.messages || [],
    [historyQuery.data]
  );

  const messages = useMemo(() => {
    const persistedText = new Set(historyMessages.map((message) => `${message.role}:${message.content?.trim()}`));
    const pendingLocal = localMessages.filter(
      (message) => !persistedText.has(`${message.role}:${message.content?.trim()}`)
    );
    return [...historyMessages, ...pendingLocal];
  }, [historyMessages, localMessages]);

  const suggestions = suggestionsQuery.data?.prompts || [];
  const savedQuestions = fallbackQuestions.length
    ? fallbackQuestions
    : suggestionsQuery.data?.savedQuestions || [];
  const mentorQuota = aiStatusQuery.data?.limits?.mentor_chat;
  const dailyLimitReached = limitReachedOverride || mentorQuota?.remaining === 0;
  const resetAt = aiStatusQuery.data?.resetAt;
  const aiAvailable = suggestionsQuery.data?.aiAvailable === true && !providerNotice;
  const canAsk = aiAvailable && !dailyLimitReached;

  useEffect(() => {
    if (mentorQuota?.remaining > 0) setLimitReachedOverride(false);
  }, [mentorQuota?.remaining]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, askMutation.isPending]);

  const addSavedAnswer = useCallback((item) => {
    if (!item) return;
    const id = Date.now();
    const createdAt = new Date().toISOString();
    setLocalMessages((current) => [
      ...current,
      {
        clientId: `${id}-question`,
        role: 'user',
        content: item.text,
        createdAt,
        metadata: { promptType: 'saved_answer' }
      },
      {
        clientId: `${id}-answer`,
        role: 'assistant',
        content: item.answer,
        createdAt,
        sources: [],
        metadata: { promptType: 'saved_answer' }
      }
    ]);
  }, []);

  const showLimitToast = useCallback(() => {
    notify.error('Daily mentor limit reached', {
      id: 'mentor-daily-limit',
      description: `New mentor questions become available ${formatResetTime(resetAt)}.`
    });
  }, [resetAt]);

  const sendPayload = useCallback(async ({ text, type = 'freeform' }) => {
    const message = String(text || '').trim();
    if (!message) return;

    if (dailyLimitReached) {
      showLimitToast();
      return;
    }

    if (!aiAvailable) {
      const saved = savedQuestions.find((item) => item.promptType === type || item.text === message) || savedQuestions[0];
      addSavedAnswer(saved);
      return;
    }

    const optimisticId = `pending-${Date.now()}`;
    setProviderNotice('');
    setLocalMessages((current) => [
      ...current,
      {
        clientId: optimisticId,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
        metadata: { promptType: type }
      }
    ]);
    reset({ message: '', promptType: 'freeform' });

    try {
      const result = await askMutation.mutateAsync({
        message,
        lessonId: lessonId || undefined,
        promptType: type
      });

      if (result?.aiAvailable === false) {
        setProviderNotice(result.message || 'Live mentor responses are temporarily unavailable.');
        setFallbackQuestions(result.savedQuestions || []);
      }
    } catch (error) {
      setLocalMessages((current) => current.filter((item) => item.clientId !== optimisticId));

      if (isDailyLimitError(error)) {
        setLimitReachedOverride(true);
        reset({ message: '', promptType: 'freeform' });
        showLimitToast();
        aiStatusQuery.refetch();
        return;
      }

      reset({ message, promptType: 'freeform' });
      notify.error('Could not send your mentor question', {
        description: error?.message || 'Please try again.'
      });
    }
  }, [
    addSavedAnswer,
    aiAvailable,
    aiStatusQuery,
    askMutation,
    dailyLimitReached,
    lessonId,
    reset,
    savedQuestions,
    showLimitToast
  ]);

  useEffect(() => {
    if (
      !autoSend ||
      autoSentRef.current ||
      dailyLimitReached ||
      suggestionsQuery.isLoading ||
      (!suggestions.length && !savedQuestions.length)
    ) return;

    autoSentRef.current = true;
    const cleanParams = new URLSearchParams(params);
    cleanParams.delete('autoSend');
    cleanParams.delete('promptType');
    setParams(cleanParams, { replace: true });

    const prompt = suggestions.find((item) => item.promptType === autoPromptType) || suggestions[0];
    const saved = savedQuestions.find((item) => item.promptType === autoPromptType) || savedQuestions[0];

    if (aiAvailable && prompt) {
      void sendPayload({ text: prompt.text, type: prompt.promptType });
    } else {
      addSavedAnswer(saved);
    }
  }, [
    addSavedAnswer,
    aiAvailable,
    autoPromptType,
    autoSend,
    dailyLimitReached,
    params,
    savedQuestions,
    sendPayload,
    setParams,
    suggestions,
    suggestionsQuery.isLoading
  ]);

  if (historyQuery.isLoading || suggestionsQuery.isLoading || aiStatusQuery.isLoading) {
    return <Loader label="Loading mentor..." />;
  }

  const orderedSuggestions = promptOrder
    .map((type) => suggestions.find((item) => item.promptType === type))
    .filter(Boolean);
  const statusLabel = dailyLimitReached ? 'Limit reached' : aiAvailable ? 'Online' : 'Saved answers';

  return (
    <section className="-mx-4 -my-8 flex min-h-[calc(100vh-4rem)] flex-col bg-page sm:-mx-6 lg:-mx-8">
      <header className="sticky top-16 z-30 border-b border-border bg-page/95 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <p className="truncate text-xs text-muted-foreground">
            {lessonId ? 'Current lesson mentor' : 'Active roadmap mentor'}
          </p>
          <span className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-semibold',
            aiAvailable && !dailyLimitReached
              ? 'border-success/20 bg-success-soft text-success'
              : 'border-warning/20 bg-warning-soft text-warning'
          )}>
            {statusLabel}
          </span>
        </div>
      </header>

      <div className="space-y-3 px-4 pt-4 sm:px-6 lg:px-8">
        {historyQuery.error ? (
          <InlineAlert tone="danger" title="Previous conversations are unavailable">
            {historyQuery.error.message}{' '}
            <button type="button" className="font-semibold underline" onClick={historyQuery.refetch}>Try again</button>
          </InlineAlert>
        ) : null}
        {suggestionsQuery.error ? (
          <InlineAlert tone="danger" title="Mentor context is unavailable">
            {suggestionsQuery.error.message}{' '}
            <button type="button" className="font-semibold underline" onClick={suggestionsQuery.refetch}>Try again</button>
          </InlineAlert>
        ) : null}
        {(providerNotice || (!aiAvailable && !suggestionsQuery.error)) ? (
          <InlineAlert tone="warning" title="Live mentor responses are unavailable">
            {providerNotice || 'You can still open saved explanations from your course.'}
          </InlineAlert>
        ) : null}
      </div>

      <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8" aria-live="polite">
        {messages.length ? (
          <div className="space-y-7">
            {messages.map((message, index) => (
              <MentorMessage
                key={message._id || message.clientId || `${message.role}-${index}`}
                message={message}
              />
            ))}
            {askMutation.isPending ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
                <Bot size={16} className="text-primary" aria-hidden="true" />
                <span>Mentor is preparing a response…</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid min-h-[300px] place-items-center rounded-panel border border-dashed border-border bg-surface-secondary/55 px-6 text-center">
            <div>
              <Bot size={24} className="mx-auto text-primary" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-foreground">Ask anything about your learning</p>
              <p className="mt-2 text-sm text-muted-foreground">Use a suggested prompt or type your own question.</p>
            </div>
          </div>
        )}

        {!aiAvailable ? <SavedAnswers items={savedQuestions} onSelect={addSavedAnswer} /> : null}
        <div ref={endRef} />
      </section>

      <div className="sticky bottom-0 z-30 bg-page/95 px-4 py-2 backdrop-blur-xl sm:px-6 lg:px-8">
        {aiAvailable && orderedSuggestions.length ? (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            {orderedSuggestions.map((item) => (
              <button
                key={item.promptType}
                type="button"
                disabled={!canAsk || askMutation.isPending}
                onClick={() => sendPayload({ text: item.text, type: item.promptType })}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-45"
              >
                <Sparkles size={12} className="text-primary" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit((values) => sendPayload({ text: values.message }))}
          className={cn(
            'relative rounded-panel border bg-surface p-2 pr-14 shadow-sm',
            errors.message ? 'border-error' : 'border-border'
          )}
        >
          <textarea
            rows={1}
            className="w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 outline-none"
            placeholder={
              dailyLimitReached
                ? `Daily mentor limit reached. Try again ${formatResetTime(resetAt)}.`
                : aiAvailable
                  ? 'Ask about your lesson or quiz mistakes…'
                  : 'Choose a saved answer above.'
            }
            disabled={!canAsk || askMutation.isPending}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            {...register('message')}
          />
          <button
            type="submit"
            disabled={!canAsk || askMutation.isPending}
            className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-control bg-primary text-white disabled:bg-surface-secondary disabled:text-muted-foreground"
            aria-label="Send message"
          >
            {askMutation.isPending ? (
              <span className="ui-spinner ui-spinner--sm" aria-hidden="true" />
            ) : canAsk ? (
              <SendHorizonal size={17} />
            ) : (
              <WifiOff size={16} />
            )}
          </button>
        </form>

        {errors.message ? <p className="mt-2 text-xs font-semibold text-error">{errors.message.message}</p> : null}
      </div>
    </section>
  );
}
