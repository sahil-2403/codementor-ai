import Skeleton from './Skeleton.jsx';

export default function Loader({ label = 'Loading...', variant = 'page' }) {
  if (variant === 'cards') {
    return <div className="grid gap-4 md:grid-cols-3" role="status" aria-label={label} aria-busy="true">
      {[1, 2, 3].map((item) => <div key={item} className="ui-card">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-5 h-8 w-3/4" />
        <Skeleton className="mt-4 h-20 w-full" />
      </div>)}
    </div>;
  }

  return <div className="ui-card mx-auto max-w-xl text-center" role="status" aria-live="polite">
    <span className="ui-spinner" aria-hidden="true" />
    <p className="mt-5 font-semibold text-foreground">{label}</p>
    <p className="mt-2 text-sm text-muted-foreground">Please wait while we prepare this for you.</p>
  </div>;
}
