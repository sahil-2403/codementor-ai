import { SendHorizonal, WifiOff } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function MentorComposer({
  register,
  error,
  canAsk,
  isAsking,
  dailyLimitReached,
  resetDescription,
  onSubmit
}) {
  return (
    <>
      <form
        onSubmit={onSubmit}
        className={cn(
          'relative rounded-panel border bg-surface p-2 pr-14 shadow-sm',
          error ? 'border-error' : 'border-border'
        )}
      >
        <textarea
          rows={1}
          className="w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 outline-none"
          placeholder={
            dailyLimitReached
              ? `Daily mentor limit reached. Try again ${resetDescription}.`
              : canAsk
                ? 'Ask about your lesson or quiz mistakes…'
                : 'Choose a saved answer above.'
          }
          disabled={!canAsk || isAsking}
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
          disabled={!canAsk || isAsking}
          className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-control bg-primary text-white disabled:bg-surface-secondary disabled:text-muted-foreground"
          aria-label="Send message"
        >
          {isAsking ? (
            <span className="ui-spinner ui-spinner--sm" aria-hidden="true" />
          ) : canAsk ? (
            <SendHorizonal size={17} />
          ) : (
            <WifiOff size={16} />
          )}
        </button>
      </form>

      {error ? <p className="mt-2 text-xs font-semibold text-error">{error}</p> : null}
    </>
  );
}
