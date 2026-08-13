import Button from '../common/Button.jsx';

export default function LogoutDialog({ isOpen, onClose }) {
  if (!isOpen) return null;

  return <div role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title" className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-[1px]">
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
      <h2 id="logout-dialog-title" className="text-lg font-bold text-foreground">Log out of CodeMentor AI?</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Confirm how you want to log out.</p>
      <div className="mt-5 flex justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  </div>;
}
