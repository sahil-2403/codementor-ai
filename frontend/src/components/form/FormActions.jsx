import Button from '../common/Button.jsx';

export default function FormActions({ submitLabel = 'Save', cancelLabel = 'Cancel', onCancel, isLoading = false, disabled = false }) {
  return <div className="flex flex-wrap justify-end gap-3">
    {onCancel && <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>{cancelLabel}</Button>}
    <Button type="submit" disabled={disabled || isLoading}>{isLoading ? 'Saving...' : submitLabel}</Button>
  </div>;
}
