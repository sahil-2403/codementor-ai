import Button from './Button.jsx';
export default function EmptyState({ title, description, actionLabel, onAction }) {
  return <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-10 text-center">
    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
    <p className="mt-2 text-slate-600">{description}</p>
    {actionLabel && <Button onClick={onAction} className="mt-5">{actionLabel}</Button>}
  </div>;
}
