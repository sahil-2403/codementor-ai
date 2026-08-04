import { useEffect, useRef } from 'react';
import { MessagesSquare } from 'lucide-react';
import MessageBubble from './MessageBubble.jsx';

export default function ChatWindow({ messages = [], isResponding = false, emptyMessage = 'Ask a coding question or open a saved course explanation.' }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, isResponding]);

  return <section className="min-h-[420px] rounded-panel border border-border bg-surface-secondary p-4 sm:p-5" aria-label="Mentor conversation" aria-live="polite">
    {messages.length ? <div className="space-y-4">{messages.map((message, index) => <MessageBubble key={message._id || message.clientId || `${message.role}-${index}`} message={message} />)}</div> : <div className="grid min-h-[360px] place-items-center text-center">
      <div><span className="mx-auto grid h-12 w-12 place-items-center rounded-surface bg-primary-soft text-primary" aria-hidden="true"><MessagesSquare size={22} /></span><p className="mt-4 font-semibold text-foreground">No conversation yet</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{emptyMessage}</p></div>
    </div>}
    {isResponding && <div className="mt-4 flex justify-start"><div className="rounded-panel border border-border bg-surface px-5 py-3 text-sm text-muted-foreground shadow-sm" role="status"><span className="ui-spinner ui-spinner--sm mr-2 align-middle" aria-hidden="true" />Preparing a response…</div></div>}
    <div ref={endRef} />
  </section>;
}
