import { BookMarked, Bot } from 'lucide-react';
import MessageBubble from './MessageBubble.jsx';

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
            <p className="break-words text-sm font-semibold text-foreground">{item.label || item.text}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Open the saved course explanation.</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function ChatWindow({
  messages = [],
  isResponding = false,
  savedAnswers = [],
  onSelectSaved,
  endRef
}) {
  return (
    <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8" aria-live="polite">
      {messages.length ? (
        <div className="space-y-7">
          {messages.map((message, index) => (
            <MessageBubble
              key={message._id || message.clientId || `${message.role}-${index}`}
              message={message}
            />
          ))}
          {isResponding ? (
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

      <SavedAnswers items={savedAnswers} onSelect={onSelectSaved} />
      <div ref={endRef} />
    </section>
  );
}
