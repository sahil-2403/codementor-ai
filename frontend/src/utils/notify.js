import { createElement } from 'react';
import { toast } from 'sonner';

let toastSequence = 0;

const DEFAULT_DURATIONS = {
  success: 4000,
  error: 10000,
  warning: 7000,
  info: 5000
};

const createToastId = () => {
  toastSequence += 1;
  return ['codementor-toast', Date.now(), toastSequence].join('-');
};

const createDismissLabel = () => createElement(
  'span',
  { className: 'grid h-full w-full place-items-center' },
  [
    createElement('span', { key: 'icon', 'aria-hidden': 'true', className: 'text-lg leading-none' }, '×'),
    createElement('span', { key: 'label', className: 'sr-only' }, 'Dismiss notification')
  ]
);

const showNotification = (type, message, options = {}) => {
  const { id: providedId, duration, action, ...remainingOptions } = options;
  const toastId = providedId || createToastId();
  const resolvedDuration = duration ?? DEFAULT_DURATIONS[type];
  const toastOptions = {
    ...remainingOptions,
    id: toastId,
    action: action || {
      label: createDismissLabel(),
      onClick: () => toast.dismiss(toastId)
    }
  };

  if (resolvedDuration !== undefined) toastOptions.duration = resolvedDuration;
  return toast[type](message, toastOptions);
};

const notify = {
  success: (message, options = {}) => showNotification('success', message, options),
  error: (message, options = {}) => showNotification('error', message, options),
  warning: (message, options = {}) => showNotification('warning', message, options),
  info: (message, options = {}) => showNotification('info', message, options),
  loading: (message, options = {}) => showNotification('loading', message, options),
  dismiss: (toastId) => toast.dismiss(toastId)
};

export default notify;
