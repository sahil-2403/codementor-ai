import { useEffect, useRef, useState } from 'react';
import { LogOut, ShieldAlert, X } from 'lucide-react';
import Button from '../common/Button.jsx';

export default function LogoutDialog({ isOpen, onClose, onConfirm, returnFocusRef }) {
  const cancelButtonRef = useRef(null);
  const [logoutFromAllDevices, setLogoutFromAllDevices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const returnFocusElement = returnFocusRef?.current;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => cancelButtonRef.current?.focus());

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
      if (returnFocusElement?.isConnected) {
        window.requestAnimationFrame(() => returnFocusElement.focus());
      }
    };
  }, [isOpen, isSubmitting, onClose, returnFocusRef]);

  useEffect(() => {
    if (isOpen) return;
    setLogoutFromAllDevices(false);
    setIsSubmitting(false);
    setErrorMessage('');
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onConfirm({ logoutFromAllDevices });
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to log out. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return <div
    role="presentation"
    className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-[1px]"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose();
    }}
  >
    <div role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title" aria-describedby="logout-dialog-description" className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
      <form onSubmit={handleSubmit}>
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-error-soft text-error">
              <LogOut size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="logout-dialog-title" className="text-lg font-bold text-foreground">Log out of CodeMentor AI?</h2>
              <p id="logout-dialog-description" className="mt-1 text-sm leading-6 text-muted-foreground">
                You will be logged out from this browser. Your other devices will remain active.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close logout confirmation" className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-muted-foreground transition hover:bg-surface-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-4 px-5 py-5 sm:px-6">
          {errorMessage ? <div role="alert" className="rounded-surface border border-error/20 bg-error-soft px-4 py-3 text-sm font-semibold text-error">{errorMessage}</div> : null}

          <label className={`flex items-start gap-3 rounded-surface border p-4 transition ${logoutFromAllDevices ? 'border-error/30 bg-error-soft' : 'border-border bg-surface-secondary/50'} ${isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
            <input type="checkbox" checked={logoutFromAllDevices} disabled={isSubmitting} onChange={(event) => { setLogoutFromAllDevices(event.target.checked); setErrorMessage(''); }} className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-indigo-600" />
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-6 text-foreground">Log out from all devices</span>
              <span className="mt-0.5 block text-sm leading-6 text-muted-foreground">Also log out the other browsers and devices using your CodeMentor AI account.</span>
            </span>
          </label>

          {logoutFromAllDevices ? <div role="note" className="rounded-surface border border-error/20 bg-error-soft px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldAlert size={19} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-bold leading-6 text-foreground">All devices will be logged out</p>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">You will need to sign in again wherever you use this account.</p>
              </div>
            </div>
          </div> : null}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-border bg-surface-secondary/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button ref={cancelButtonRef} type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting} loadingLabel={logoutFromAllDevices ? 'Logging out all devices...' : 'Logging out...'}>{logoutFromAllDevices ? 'Log out all devices' : 'Log out'}</Button>
        </footer>
      </form>
    </div>
  </div>;
}
