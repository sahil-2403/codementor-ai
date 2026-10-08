import { Bot, FileText, User } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const sourceLabel = (source) =>
  source?.title || source?.name || source?.refId ||
  (typeof source === 'string' ? source : 'Learning source');

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MessageBubble({ message }) {
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
