import Button from './Button.jsx';

export default function ConfirmDialog({ open, title = 'Are you sure?', description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger', isLoading = false, onConfirm, onCancel }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[2rem] border border-white/30 bg-white p-6 shadow-2xl">
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      {description && <p className="mt-2 leading-7 text-slate-600">{description}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>{cancelLabel}</Button>
        <Button type="button" onClick={onConfirm} disabled={isLoading} className={tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : ''}>{isLoading ? 'Working...' : confirmLabel}</Button>
      </div>
    </div>
  </div>;
}
