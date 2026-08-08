import { useEffect, useId, useRef } from 'react';
import Button from './Button.jsx';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  children = null,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading = false,
  confirmDisabled = false,
  loadingLabel = 'Working...',
  onConfirm,
  onCancel
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const isLoadingRef = useRef(isLoading);
  const titleId = useId();
  const descriptionId = useId();

  onCancelRef.current = onCancel;
  isLoadingRef.current = isLoading;

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => cancelButtonRef.current?.focus());

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoadingRef.current) {
        event.preventDefault();
        onCancelRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll(focusableSelector) || [])];
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const closeFromBackdrop = (event) => {
    if (event.target === event.currentTarget && !isLoading) onCancel?.();
  };

  return <div className="ui-dialog-backdrop" onMouseDown={closeFromBackdrop}>
    <div
      ref={dialogRef}
      className="ui-dialog-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={-1}
    >
      <h2 id={titleId} className="text-2xl font-bold text-foreground">{title}</h2>
      {description && <p id={descriptionId} className="mt-2 leading-7 text-muted-foreground">{description}</p>}
      {children ? <div className="mt-5">{children}</div> : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button ref={cancelButtonRef} type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>{cancelLabel}</Button>
        <Button
          type="button"
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          isLoading={isLoading}
          loadingLabel={loadingLabel}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </div>;
}
