import { cn } from '../../utils/cn.js';
import Button from './Button.jsx';

export default function EmptyState({ title, description, actionLabel, onAction, action = null, icon: Icon, className = '', ...props }) {
  return <div className={cn('ui-empty-state', className)} role="status" {...props}>
    {Icon && <span className="ui-empty-state-icon" aria-hidden="true"><Icon size={22} /></span>}
    <h3 className={cn('text-xl font-bold text-foreground', Icon && 'mt-4')}>{title}</h3>
    {description && <p className="mx-auto mt-2 max-w-xl leading-7 text-muted-foreground">{description}</p>}
    {(action || actionLabel) && <div className="mt-5">
      {action || <Button type="button" onClick={onAction}>{actionLabel}</Button>}
    </div>}
  </div>;
}
