import Badge from '../common/Badge.jsx';
import { cn } from '../../utils/cn.js';

const sourceLabel = (source) => source?.title || source?.name || source?.refId || (typeof source === 'string' ? source : 'Learning source');

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isSaved = message.metadata?.promptType === 'saved_answer';
  return <article className={cn('flex', isUser ? 'justify-end' : 'justify-start')} aria-label={isUser ? 'Your message' : isSaved ? 'Saved course explanation' : 'Mentor response'}>
    <div className={cn('max-w-[92%] rounded-panel px-5 py-4 text-sm leading-7 sm:max-w-[82%]', isUser ? 'bg-foreground text-white' : 'border border-border bg-surface text-foreground shadow-sm')}>
      {!isUser && <div className="mb-2 flex flex-wrap gap-2"><Badge variant={isSaved ? 'neutral' : 'info'}>{isSaved ? 'Saved course answer' : 'Gemini mentor'}</Badge></div>}
      <div className="whitespace-pre-line">{message.content}</div>
      {!isUser && message.sources?.length ? <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Context used</p>
        <div className="flex flex-wrap gap-2">{message.sources.map((source, index) => <Badge key={`${sourceLabel(source)}-${index}`} variant="neutral">{sourceLabel(source)}</Badge>)}</div>
      </div> : null}
      {!isUser && message.metadata?.promptType && !isSaved ? <p className="mt-3 text-xs font-semibold capitalize text-muted-foreground">Mode: {String(message.metadata.promptType).replaceAll('_', ' ')}</p> : null}
    </div>
  </article>;
}
