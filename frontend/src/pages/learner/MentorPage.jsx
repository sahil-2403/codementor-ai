import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import Loader from '../../components/common/Loader.jsx';
import ChatWindow from '../../components/mentor/ChatWindow.jsx';
import MentorComposer from '../../components/mentor/MentorComposer.jsx';
import MentorPrompts from '../../components/mentor/MentorPrompts.jsx';
import { mentorApi } from '../../api/mentorApi.js';
import { mentorAskSchema } from '../../validations/mentor.schema.js';
import { cn } from '../../utils/cn.js';
import notify from '../../utils/notify.js';

const promptOrder = [
  'simple_explanation',
  'real_project_example',
  'interview_answer',
  'practice_question'
];

const formatResetTime = (value) => {
  if (!value) return 'after the daily reset';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'after the daily reset';
  return date.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
};

const isDailyLimitError = (error) =>
  error?.code === 'AI_DAILY_LIMIT_REACHED' ||
  (error?.response?.status === 429 && /daily.*limit|limit.*reached/i.test(error?.message || ''));

export default function MentorPage() {
  const [params, setParams] = useSearchParams();
  const lessonId = params.get('lessonId');
  const autoSend = params.get('autoSend') === 'true';
  const autoPromptType = params.get('promptType') || 'simple_explanation';

  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [historyAttempt, setHistoryAttempt] = useState(0);
  const [suggestionsData, setSuggestionsData] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState(null);
  const [suggestionsAttempt, setSuggestionsAttempt] = useState(0);
  const [aiStatusData, setAiStatusData] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [isAsking, setIsAsking] = useState(false);

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

  useEffect(() => {
    let active = true;
    setHistoryError(null);

    mentorApi.history()
      .then((result) => {
        if (active) setHistoryData(result);
      })
      .catch((error) => {
        if (active) setHistoryError(error);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [historyAttempt]);

  useEffect(() => {
    let active = true;
    setSuggestionsError(null);

    mentorApi.suggestions(lessonId)
      .then((result) => {
        if (active) setSuggestionsData(result);
      })
      .catch((error) => {
        if (active) setSuggestionsError(error);
      })
      .finally(() => {
        if (active) setSuggestionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lessonId, suggestionsAttempt]);

  const reloadStatus = useCallback(async () => {
    try {
      const result = await mentorApi.status();
      setAiStatusData(result);
    } catch {
      // Status is helpful for quota display, but mentor suggestions still decide availability.
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadStatus();
  }, [reloadStatus]);

  const historyMessages = useMemo(
    () => historyData?.chats?.[0]?.messages || [],
    [historyData]
  );

  const messages = useMemo(() => {
    const persistedText = new Set(historyMessages.map((message) => `${message.role}:${message.content?.trim()}`));
    const pendingLocal = localMessages.filter(
      (message) => !persistedText.has(`${message.role}:${message.content?.trim()}`)
    );
    return [...historyMessages, ...pendingLocal];
  }, [historyMessages, localMessages]);

  const suggestions = suggestionsData?.prompts || [];
  const savedQuestions = fallbackQuestions.length
    ? fallbackQuestions
    : suggestionsData?.savedQuestions || [];
  const mentorQuota = aiStatusData?.limits?.mentor_chat;
  const dailyLimitReached = limitReachedOverride || mentorQuota?.remaining === 0;
  const resetAt = aiStatusData?.resetAt;
  const aiAvailable = suggestionsData?.aiAvailable === true && !providerNotice;
  const canAsk = aiAvailable && !dailyLimitReached;

  useEffect(() => {
    if (mentorQuota?.remaining > 0) setLimitReachedOverride(false);
  }, [mentorQuota?.remaining]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isAsking]);

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
    if (!message || isAsking) return;

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
    setIsAsking(true);

    try {
      const result = await mentorApi.ask({
        message,
        lessonId: lessonId || undefined,
        promptType: type
      });

      if (result?.chat) {
        setHistoryData({ chats: [result.chat] });
      }

      if (result?.aiAvailable === false) {
        setLocalMessages((current) => current.filter((item) => item.clientId !== optimisticId));
        setProviderNotice(result.message || 'Live mentor responses are temporarily unavailable.');
        setFallbackQuestions(result.savedQuestions || []);
      }

      void reloadStatus();
    } catch (error) {
      setLocalMessages((current) => current.filter((item) => item.clientId !== optimisticId));

      if (isDailyLimitError(error)) {
        setLimitReachedOverride(true);
        reset({ message: '', promptType: 'freeform' });
        showLimitToast();
        void reloadStatus();
        return;
      }

      reset({ message, promptType: 'freeform' });
      notify.error('Could not send your mentor question', {
        description: error?.message || 'Please try again.'
      });
    } finally {
      setIsAsking(false);
    }
  }, [
    addSavedAnswer,
    aiAvailable,
    dailyLimitReached,
    isAsking,
    lessonId,
    reloadStatus,
    reset,
    savedQuestions,
    showLimitToast
  ]);

  useEffect(() => {
    if (
      !autoSend ||
      autoSentRef.current ||
      dailyLimitReached ||
      suggestionsLoading ||
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
    suggestionsLoading
  ]);

  if (historyLoading || suggestionsLoading || statusLoading) {
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
        {historyError ? (
          <InlineAlert tone="danger" title="Previous conversations are unavailable">
            {historyError.message}{' '}
            <button type="button" className="font-semibold underline" onClick={() => setHistoryAttempt((value) => value + 1)}>Try again</button>
          </InlineAlert>
        ) : null}
        {suggestionsError ? (
          <InlineAlert tone="danger" title="Mentor context is unavailable">
            {suggestionsError.message}{' '}
            <button type="button" className="font-semibold underline" onClick={() => setSuggestionsAttempt((value) => value + 1)}>Try again</button>
          </InlineAlert>
        ) : null}
        {(providerNotice || (!aiAvailable && !suggestionsError)) ? (
          <InlineAlert tone="warning" title="Live mentor responses are unavailable">
            {providerNotice || 'You can still open saved explanations from your course.'}
          </InlineAlert>
        ) : null}
      </div>

      <ChatWindow
        messages={messages}
        isResponding={isAsking}
        savedAnswers={!aiAvailable ? savedQuestions : []}
        onSelectSaved={addSavedAnswer}
        endRef={endRef}
      />

      <div className="sticky bottom-0 z-30 bg-page/95 px-4 py-2 backdrop-blur-xl sm:px-6 lg:px-8">
        {aiAvailable ? (
          <MentorPrompts
            items={orderedSuggestions}
            disabled={!canAsk || isAsking}
            onSelect={(item) => sendPayload({ text: item.text, type: item.promptType })}
          />
        ) : null}

        <MentorComposer
          register={register}
          error={errors.message?.message}
          canAsk={canAsk}
          isAsking={isAsking}
          dailyLimitReached={dailyLimitReached}
          resetDescription={formatResetTime(resetAt)}
          onSubmit={handleSubmit((values) => sendPayload({ text: values.message }))}
        />
      </div>
    </section>
  );
}
