import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  BookMarked,
  Bot,
  FileText,
  Sparkles,
  User,
  WifiOff,
  SendHorizonal,
} from "lucide-react";
import InlineAlert from "../../components/common/InlineAlert.jsx";
import Loader from "../../components/common/Loader.jsx";
import {
  useAskMentor,
  useMentorAIStatus,
  useMentorHistory,
  useMentorSuggestions,
} from "../../queries/mentorQueries.js";
import { mentorAskSchema } from "../../validations/mentor.schema.js";
import { cn } from "../../utils/cn.js";
import notify from "../../utils/notify.js";

const sourceLabel = (source) =>
  source?.title ||
  source?.name ||
  source?.refId ||
  (typeof source === "string" ? source : "Learning source");
const promptOrder = [
  "simple_explanation",
  "real_project_example",
  "interview_answer",
  "practice_question",
];
const MENTOR_LIMIT_TOAST_ID = "mentor-daily-limit";

const formatMessageTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatResetTime = (value) => {
  if (!value) return "after the daily reset";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "after the daily reset";
  return date.toLocaleString([], {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isDailyLimitError = (error) =>
  error?.code === "AI_DAILY_LIMIT_REACHED" ||
  (error?.status === 429 &&
    /daily.*limit|limit.*reached/i.test(error?.message || ""));

const normalizeMentorContent = (value) => {
  let text = String(value || "")
    .replace(/\r\n/g, "\n")
    .trim();
  const isWrappedInDoubleQuotes =
    text.length > 1 && text.startsWith('"') && text.endsWith('"');
  const isWrappedInSingleQuotes =
    text.length > 1 && text.startsWith("'") && text.endsWith("'");

  if (isWrappedInDoubleQuotes || isWrappedInSingleQuotes) {
    text = text
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  }

  return text;
};

function InlineMarkdown({ text }) {
  const parts = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];

    if (token.startsWith("`")) {
      parts.push(
        <code
          key={`${match.index}-code`}
          className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**") || token.startsWith("__")) {
      parts.push(
        <strong key={`${match.index}-strong`} className="font-bold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <em key={`${match.index}-em`} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

const textBlockType = (line) => {
  if (/^#{1,6}\s+/.test(line)) return "heading";
  if (/^[-*+]\s+/.test(line)) return "unordered";
  if (/^\d+\.\s+/.test(line)) return "ordered";
  if (/^>\s?/.test(line)) return "quote";
  return "paragraph";
};

function StructuredText({ value }) {
  const lines = value.split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const type = textBlockType(line);

    if (type === "unordered" || type === "ordered") {
      const items = [];
      const matcher = type === "unordered" ? /^[-*+]\s+/ : /^\d+\.\s+/;
      while (
        index < lines.length &&
        textBlockType(lines[index].trim()) === type
      ) {
        items.push(lines[index].trim().replace(matcher, ""));
        index += 1;
      }
      blocks.push({ type, items });
      continue;
    }

    if (type === "heading") {
      const level = Math.min(line.match(/^#+/)?.[0].length || 2, 4);
      blocks.push({ type, level, value: line.replace(/^#{1,6}\s+/, "") });
      index += 1;
      continue;
    }

    if (type === "quote") {
      const quoteLines = [];
      while (
        index < lines.length &&
        textBlockType(lines[index].trim()) === "quote"
      ) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type, value: quoteLines.join(" ") });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length) {
      const nextLine = lines[index].trim();
      if (!nextLine || textBlockType(nextLine) !== "paragraph") break;
      paragraphLines.push(nextLine);
      index += 1;
    }
    blocks.push({ type: "paragraph", value: paragraphLines.join(" ") });
  }

  return (
    <div className="space-y-3 break-words [overflow-wrap:anywhere]">
      {blocks.map((block, blockIndex) => {
        if (block.type === "heading") {
          const classes =
            block.level <= 2
              ? "text-base font-bold leading-6"
              : "text-sm font-bold leading-6";
          return (
            <h3 key={`heading-${blockIndex}`} className={classes}>
              <InlineMarkdown text={block.value} />
            </h3>
          );
        }
        if (block.type === "unordered") {
          return (
            <ul
              key={`unordered-${blockIndex}`}
              className="list-disc space-y-1 pl-5"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <InlineMarkdown text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ordered") {
          return (
            <ol
              key={`ordered-${blockIndex}`}
              className="list-decimal space-y-1 pl-5"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <InlineMarkdown text={item} />
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote
              key={`quote-${blockIndex}`}
              className="border-l-2 border-primary/35 pl-3 italic text-muted-foreground"
            >
              <InlineMarkdown text={block.value} />
            </blockquote>
          );
        }
        return (
          <p key={`paragraph-${blockIndex}`}>
            <InlineMarkdown text={block.value} />
          </p>
        );
      })}
    </div>
  );
}

function MentorMessageContent({ content = "" }) {
  const normalizedContent = normalizeMentorContent(content);
  const blocks = [];
  const pattern = /```([\w#+.-]+)?\s*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(normalizedContent)) !== null) {
    if (match.index > lastIndex)
      blocks.push({
        type: "text",
        value: normalizedContent.slice(lastIndex, match.index),
      });
    blocks.push({
      type: "code",
      language: match[1] || "code",
      value: match[2].trimEnd(),
    });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < normalizedContent.length)
    blocks.push({ type: "text", value: normalizedContent.slice(lastIndex) });
  if (!blocks.length) blocks.push({ type: "text", value: normalizedContent });

  return (
    <div className="space-y-4">
      {blocks.map((block, index) =>
        block.type === "code" ? (
          <div
            key={`${block.type}-${index}`}
            className="max-w-full overflow-hidden rounded-control bg-slate-950 text-slate-100"
          >
            <div className="border-b border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-slate-400">
              {block.language}
            </div>
            <pre className="max-w-full overflow-x-auto p-4 text-[13px] leading-6">
              <code>{block.value}</code>
            </pre>
          </div>
        ) : (
          <StructuredText key={`${block.type}-${index}`} value={block.value} />
        ),
      )}
    </div>
  );
}

function MentorMessage({ message }) {
  const isUser = message.role === "user";
  const isSaved = message.metadata?.promptType === "saved_answer";
  const time = formatMessageTime(message.createdAt);

  return (
    <article
      className={cn("flex w-full gap-2", isUser && "flex-row-reverse")}
      aria-label={
        isUser
          ? "Your message"
          : isSaved
            ? "Saved course explanation"
            : "Mentor response"
      }
    >
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded-control",
          isUser ? "text-muted-foreground" : "text-primary-strong",
        )}
        aria-hidden="true"
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </span>

      <div
        className={cn(
          "min-w-0 w-fit max-w-[70%]",
          isUser && "flex flex-col items-end",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 text-[11px] text-muted-foreground",
            isUser && "flex-row-reverse",
          )}
        >
          <span className="font-semibold text-foreground">
            {isUser ? "You" : "Mentor"}
          </span>
          {time && <span className="font-mono">{time}</span>}
          {isSaved && (
            <span className="rounded-full bg-surface-secondary px-2 py-0.5 font-semibold">
              Saved answer
            </span>
          )}
        </div>

        <div
          className={cn(
            "mt-1.5 max-w-full break-words rounded-panel px-4 py-3 text-sm leading-7 [overflow-wrap:anywhere]",
            isUser
              ? "bg-primary text-white shadow-sm"
              : "border border-border bg-surface text-foreground shadow-sm",
          )}
        >
          <MentorMessageContent content={message.content} />
        </div>

        {!isUser && message.sources?.length ? (
          <div className="mt-2 flex max-w-full flex-wrap gap-1.5">
            {message.sources.map((source, index) => (
              <span
                key={`${sourceLabel(source)}-${index}`}
                className="inline-flex max-w-full items-center gap-1 break-words rounded-full border border-primary/15 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-strong [overflow-wrap:anywhere]"
              >
                <FileText size={12} className="shrink-0" aria-hidden="true" />
                {sourceLabel(source)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MentorConversation({
  messages,
  isResponding,
  aiAvailable,
  savedQuestions,
  onSavedAnswer,
  activeQuestion,
  anchorVersion,
}) {
  const endRef = useRef(null);
  const activeQuestionRef = useRef(null);
  const initialScrollDoneRef = useRef(false);

  const activeQuestionIndex = useMemo(() => {
    if (!activeQuestion) return -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (
        messages[index].role === "user" &&
        messages[index].content?.trim() === activeQuestion.trim()
      )
        return index;
    }
    return -1;
  }, [activeQuestion, messages]);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "auto",
    });
  }, []);

  const scrollToActiveQuestion = useCallback(() => {
    const node = activeQuestionRef.current;
    if (!node) return;
    const stickyOffset = 148;
    const top = Math.max(
      0,
      window.scrollY + node.getBoundingClientRect().top - stickyOffset,
    );
    window.scrollTo({ top, behavior: "auto" });
  }, []);

  useLayoutEffect(() => {
    if (initialScrollDoneRef.current || activeQuestion || !messages.length)
      return undefined;
    initialScrollDoneRef.current = true;
    scrollToBottom();

    let secondFrame;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(scrollToBottom);
    });
    const shortDelay = window.setTimeout(scrollToBottom, 100);
    const layoutDelay = window.setTimeout(scrollToBottom, 320);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(shortDelay);
      window.clearTimeout(layoutDelay);
    };
  }, [activeQuestion, messages.length, scrollToBottom]);

  useLayoutEffect(() => {
    if (!activeQuestion || activeQuestionIndex < 0) return undefined;
    initialScrollDoneRef.current = true;
    scrollToActiveQuestion();

    let secondFrame;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(scrollToActiveQuestion);
    });
    const shortDelay = window.setTimeout(scrollToActiveQuestion, 80);
    const layoutDelay = window.setTimeout(scrollToActiveQuestion, 240);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(shortDelay);
      window.clearTimeout(layoutDelay);
    };
  }, [
    activeQuestion,
    activeQuestionIndex,
    anchorVersion,
    isResponding,
    messages.length,
    scrollToActiveQuestion,
  ]);

  return (
    <section
      className="w-full flex-1 px-4 py-6 [overflow-anchor:none] sm:px-6 lg:px-8"
      aria-label="Mentor conversation"
      aria-live="polite"
    >
      {messages.length ? (
        <div className="space-y-7">
          {messages.map((message, index) => (
            <div
              key={
                message._id || message.clientId || `${message.role}-${index}`
              }
              ref={index === activeQuestionIndex ? activeQuestionRef : null}
            >
              <MentorMessage message={message} />
            </div>
          ))}
          {isResponding && (
            <div
              className="flex items-center gap-3 text-sm text-muted-foreground"
              role="status"
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-control border border-primary/20 bg-primary-soft text-primary-strong"
                aria-hidden="true"
              >
                <Bot size={15} />
              </span>
              <span className="animate-pulse">
                Mentor is preparing a response…
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid min-h-[360px] place-items-center rounded-panel border border-dashed border-border bg-surface-secondary/55 px-6 py-16 text-center">
          <div>
            <span
              className="mx-auto grid h-11 w-11 place-items-center rounded-control border border-primary/20 bg-primary-soft text-primary-strong"
              aria-hidden="true"
            >
              <Bot size={20} />
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">
              Ask anything about your learning
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              The mentor can use your active roadmap, current lesson, recent
              quiz mistakes, and weak topics to make the answer more relevant.
            </p>
          </div>
        </div>
      )}

      {!aiAvailable && savedQuestions.length ? (
        <section className="mt-8" aria-labelledby="saved-answers-title">
          <div className="flex items-center gap-2">
            <BookMarked size={17} className="text-primary" aria-hidden="true" />
            <h2
              id="saved-answers-title"
              className="text-sm font-bold text-foreground"
            >
              Saved answers for this learning context
            </h2>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {savedQuestions.map((item, index) => (
              <button
                key={`${item.text || item.label}-${index}`}
                type="button"
                onClick={() => onSavedAnswer(item)}
                className="rounded-panel border border-border bg-surface p-4 text-left transition hover:border-primary/35 hover:shadow-sm focus-visible:ring-4 focus-visible:ring-primary-soft"
              >
                <p className="break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                  {item.label || item.text}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Open the saved course explanation in this conversation.
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div
        ref={endRef}
        className={cn(
          "transition-[height]",
          activeQuestion ? "h-[50vh] min-h-72" : "h-2",
        )}
      />
    </section>
  );
}

function MentorComposer({
  aiAvailable,
  canAsk,
  dailyLimitReached,
  resetAt,
  suggestions,
  isPending,
  register,
  errors,
  handleSubmit,
  onSubmit,
  onPrompt,
}) {
  const orderedSuggestions = useMemo(
    () =>
      promptOrder
        .map((type) => suggestions.find((item) => item.promptType === type))
        .filter(Boolean),
    [suggestions],
  );
  const resetLabel = formatResetTime(resetAt);

  return (
    <div className="sticky bottom-0 z-30  bg-page/95 backdrop-blur-xl">
      <div className="w-full px-4 py-2 sm:px-6 lg:px-8">
        {aiAvailable && orderedSuggestions.length ? (
          <div className="mb-1 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {orderedSuggestions.map((item) => (
              <button
                key={item.promptType}
                type="button"
                disabled={!canAsk || isPending}
                onClick={() => onPrompt(item)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Sparkles
                  size={12}
                  className="text-primary"
                  aria-hidden="true"
                />
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={cn(
            "relative place-items-center rounded-panel border bg-surface p-2 pr-14 shadow-sm transition focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary-soft",
            errors.message ? "border-error" : "border-border",
            !canAsk && "bg-surface-secondary opacity-80",
          )}
        >
          <textarea
            rows={1}
            className="w-full border-0 self-center bg-transparent px-2 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:text-muted-foreground"
            placeholder={
              dailyLimitReached
                ? `Daily mentor limit reached. Try again ${resetLabel}.`
                : aiAvailable
                  ? "Ask about your lesson, quiz mistakes, or paste code to review…"
                  : "Free-form questions are unavailable. Choose a saved answer above."
            }
            aria-invalid={Boolean(errors.message)}
            disabled={!canAsk || isPending}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            {...register("message")}
          />

          <button
            type="submit"
            disabled={!canAsk || isPending}
            className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-control bg-primary text-white shadow-sm transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-muted-foreground"
            aria-label={
              isPending
                ? "Preparing response"
                : canAsk
                  ? "Send message"
                  : dailyLimitReached
                    ? "Daily mentor limit reached"
                    : "Mentor unavailable"
            }
          >
            {isPending ? (
              <span className="ui-spinner ui-spinner--sm" aria-hidden="true" />
            ) : canAsk ? (
              <SendHorizonal size={17} />
            ) : (
              <WifiOff size={16} />
            )}
          </button>
        </form>

        {errors.message && (
          <p className="mt-2 text-xs font-semibold text-error">
            {errors.message.message}
          </p>
        )}
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
          {dailyLimitReached
            ? `Your daily quota resets ${resetLabel}. Existing mentor answers remain available.`
            : aiAvailable
              ? "Answers use your lesson, quiz history, and flagged weak topics as context."
              : "Saved explanations from your course remain available while live mentor responses are unavailable."}
        </p>
      </div>
    </div>
  );
}

export default function MentorPage() {
  const [params] = useSearchParams();
  const lessonId = params.get("lessonId");
  const autoSend = params.get("autoSend") === "true";
  const autoPromptType = params.get("promptType") || "simple_explanation";
  const historyQuery = useMentorHistory();
  const suggestionsQuery = useMentorSuggestions(lessonId);
  const aiStatusQuery = useMentorAIStatus();
  const askMutation = useAskMentor();
  const [localMessages, setLocalMessages] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState("");
  const [anchorVersion, setAnchorVersion] = useState(0);
  const [limitReachedOverride, setLimitReachedOverride] = useState(false);
  const [autoSent, setAutoSent] = useState(false);
  const [providerNotice, setProviderNotice] = useState("");
  const [fallbackQuestions, setFallbackQuestions] = useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mentorAskSchema),
    defaultValues: { message: "", promptType: "freeform" },
  });

  const historyMessages = useMemo(
    () => historyQuery.data?.chats?.[0]?.messages || [],
    [historyQuery.data],
  );
  const messages = useMemo(() => {
    const latestPersistedUser = [...historyMessages]
      .reverse()
      .find((message) => message.role === "user");
    const visibleLocalMessages = localMessages.filter(
      (message) =>
        !(
          message.metadata?.optimistic &&
          latestPersistedUser?.content?.trim() === message.content?.trim()
        ),
    );
    return [...historyMessages, ...visibleLocalMessages];
  }, [historyMessages, localMessages]);
  const suggestions = suggestionsQuery.data?.prompts || [];
  const savedQuestions = fallbackQuestions.length
    ? fallbackQuestions
    : suggestionsQuery.data?.savedQuestions || [];
  const context = suggestionsQuery.data?.context || {};
  const mentorQuota = aiStatusQuery.data?.limits?.mentor_chat;
  const dailyLimitReached =
    limitReachedOverride || mentorQuota?.remaining === 0;
  const resetAt = aiStatusQuery.data?.resetAt;
  const latestMessageContext = useMemo(
    () =>
      [...historyMessages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" &&
            (message.metadata?.lessonTitle || message.metadata?.moduleTitle),
        )?.metadata || {},
    [historyMessages],
  );
  const aiAvailable =
    suggestionsQuery.data?.aiAvailable === true && !providerNotice;
  const canAsk = aiAvailable && !dailyLimitReached;
  const contextLabel = [
    context.courseTitle || "Active roadmap",
    context.lessonTitle ||
      latestMessageContext.lessonTitle ||
      context.moduleTitle ||
      latestMessageContext.moduleTitle ||
      (lessonId ? "Current lesson" : "Your learning path"),
  ]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    if (mentorQuota?.remaining > 0) setLimitReachedOverride(false);
  }, [mentorQuota?.remaining]);

  const addSavedAnswer = useCallback((item) => {
    if (!item) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();
    setActiveQuestion(item.text);
    setAnchorVersion((value) => value + 1);
    setLocalMessages((current) => [
      ...current,
      {
        clientId: `${id}-q`,
        role: "user",
        content: item.text,
        createdAt,
        metadata: { promptType: "saved_answer" },
      },
      {
        clientId: `${id}-a`,
        role: "assistant",
        content: item.answer,
        createdAt,
        sources: [],
        metadata: { promptType: "saved_answer" },
      },
    ]);
  }, []);

  const showLimitToast = useCallback(() => {
    notify.error("Daily mentor limit reached", {
      id: MENTOR_LIMIT_TOAST_ID,
      description: `New mentor questions become available ${formatResetTime(resetAt)}.`,
    });
  }, [resetAt]);

  const sendPayload = useCallback(
    async ({ text, type = "freeform" }) => {
      const message = text.trim();
      if (!message) return;
      if (dailyLimitReached) {
        showLimitToast();
        return;
      }
      if (!aiAvailable) {
        addSavedAnswer(
          savedQuestions.find(
            (item) => item.promptType === type || item.text === message,
          ) || savedQuestions[0],
        );
        return;
      }

      const optimisticId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticMessage = {
        clientId: optimisticId,
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
        metadata: { promptType: type, optimistic: true },
      };

      setProviderNotice("");
      setActiveQuestion(message);
      setAnchorVersion((value) => value + 1);
      setLocalMessages((current) => [...current, optimisticMessage]);
      reset({ message: "", promptType: "freeform" });

      try {
        const result = await askMutation.mutateAsync({
          message,
          lessonId: lessonId || undefined,
          promptType: type,
        });
        if (result?.aiAvailable === false) {
          setProviderNotice(
            result.message ||
              "Live mentor responses are temporarily unavailable.",
          );
          setFallbackQuestions(result.savedQuestions || []);
          setLocalMessages((current) =>
            current.map((item) =>
              item.clientId === optimisticId
                ? { ...item, metadata: { promptType: type } }
                : item,
            ),
          );
          setAnchorVersion((value) => value + 1);
          return;
        }
        setLocalMessages((current) =>
          current.filter((item) => item.clientId !== optimisticId),
        );
        setAnchorVersion((value) => value + 1);
      } catch (error) {
        setLocalMessages((current) =>
          current.filter((item) => item.clientId !== optimisticId),
        );

        if (isDailyLimitError(error)) {
          setLimitReachedOverride(true);
          setActiveQuestion("");
          reset({ message: "", promptType: "freeform" });
          showLimitToast();
          aiStatusQuery.refetch();
          return;
        }

        reset({ message, promptType: "freeform" });
        notify.error("Could not send your mentor question", {
          description: error?.message || "Please try again.",
        });
      }
    },
    [
      addSavedAnswer,
      aiAvailable,
      aiStatusQuery,
      askMutation,
      dailyLimitReached,
      lessonId,
      reset,
      savedQuestions,
      showLimitToast,
    ],
  );

  useEffect(() => {
    if (
      !autoSend ||
      autoSent ||
      dailyLimitReached ||
      suggestionsQuery.isLoading ||
      (!suggestions.length && !savedQuestions.length)
    )
      return;
    setAutoSent(true);
    const prompt =
      suggestions.find((item) => item.promptType === autoPromptType) ||
      suggestions[0];
    const saved =
      savedQuestions.find((item) => item.promptType === autoPromptType) ||
      savedQuestions[0];
    if (aiAvailable && prompt)
      sendPayload({ text: prompt.text, type: prompt.promptType });
    else addSavedAnswer(saved);
  }, [
    addSavedAnswer,
    aiAvailable,
    autoPromptType,
    autoSend,
    autoSent,
    dailyLimitReached,
    savedQuestions,
    sendPayload,
    suggestions,
    suggestionsQuery.isLoading,
  ]);

  if (
    historyQuery.isLoading ||
    suggestionsQuery.isLoading ||
    aiStatusQuery.isLoading
  )
    return <Loader label="Loading mentor..." />;

  const statusLabel = dailyLimitReached
    ? "Limit reached"
    : aiAvailable
      ? "Online"
      : "Saved answers";
  const statusAvailable = aiAvailable && !dailyLimitReached;

  return (
    <section className="-mx-4 -my-8 flex min-h-[calc(100vh-4rem)] flex-col bg-page sm:-mx-6 lg:-mx-8">
      <header className="sticky top-16 z-30 border-b border-border bg-page/95 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <p className="truncate text-xs text-muted-foreground">
              {contextLabel}
            </p>
          </div>

          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
              statusAvailable
                ? "border-success/20 bg-success-soft text-success"
                : "border-warning/20 bg-warning-soft text-warning",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                statusAvailable ? "bg-success" : "bg-warning",
              )}
              aria-hidden="true"
            />
            {statusLabel}
          </span>
        </div>
      </header>

      <div className="w-full space-y-3 px-4 pt-4 sm:px-6 lg:px-8">
        {historyQuery.error && (
          <InlineAlert
            tone="danger"
            title="Previous conversations are unavailable"
          >
            {historyQuery.error.message}{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => historyQuery.refetch()}
            >
              Try again
            </button>
          </InlineAlert>
        )}
        {suggestionsQuery.error && (
          <InlineAlert tone="danger" title="Mentor context is unavailable">
            {suggestionsQuery.error.message}{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => suggestionsQuery.refetch()}
            >
              Try again
            </button>
          </InlineAlert>
        )}
        {(providerNotice || (!aiAvailable && !suggestionsQuery.error)) && (
          <InlineAlert
            tone="warning"
            title="Live mentor responses are unavailable"
          >
            {providerNotice ||
              "You can still open saved explanations from your course."}
          </InlineAlert>
        )}
      </div>

      <MentorConversation
        messages={messages}
        isResponding={askMutation.isPending}
        aiAvailable={aiAvailable}
        savedQuestions={savedQuestions}
        onSavedAnswer={addSavedAnswer}
        activeQuestion={activeQuestion}
        anchorVersion={anchorVersion}
      />

      <MentorComposer
        aiAvailable={aiAvailable}
        canAsk={canAsk}
        dailyLimitReached={dailyLimitReached}
        resetAt={resetAt}
        suggestions={suggestions}
        isPending={askMutation.isPending}
        register={register}
        errors={errors}
        handleSubmit={handleSubmit}
        onSubmit={(values) =>
          sendPayload({ text: values.message, type: "freeform" })
        }
        onPrompt={(item) =>
          sendPayload({ text: item.text, type: item.promptType })
        }
      />
    </section>
  );
}
