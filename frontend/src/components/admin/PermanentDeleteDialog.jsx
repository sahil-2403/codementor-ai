import ConfirmDialog from '../common/ConfirmDialog.jsx';
import Input from '../common/Input.jsx';
import LifecycleError from './LifecycleError.jsx';

export default function PermanentDeleteDialog({
  open,
  title,
  description = '',
  confirmation,
  onConfirmationChange,
  onCancel,
  onConfirm,
  isLoading = false,
  error = null
}) {
  return (
    <ConfirmDialog
      open={open}
      title={title}
      description={description}
      confirmLabel="Delete permanently"
      tone="danger"
      isLoading={isLoading}
      confirmDisabled={confirmation !== 'DELETE'}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <Input
        label="Type DELETE to confirm"
        value={confirmation}
        onChange={(event) => onConfirmationChange(event.target.value)}
      />
      <LifecycleError error={error} />
    </ConfirmDialog>
  );
}
