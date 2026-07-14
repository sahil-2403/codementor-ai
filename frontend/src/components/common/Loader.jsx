import Skeleton from './Skeleton.jsx';

export default function Loader({ label = 'Loading...', variant = 'page' }) {
  if (variant === 'cards') {
    return <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((item) => <div key={item} className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-soft">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-5 h-8 w-3/4" />
        <Skeleton className="mt-4 h-20 w-full" />
      </div>)}
    </div>;
  }

  return <div className="mx-auto max-w-xl rounded-[2rem] border border-white/60 bg-white/80 p-8 text-center shadow-soft backdrop-blur">
    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
    <p className="mt-5 font-bold text-slate-700">{label}</p>
    <p className="mt-2 text-sm text-slate-500">Please wait while we prepare this for you.</p>
  </div>;
}
