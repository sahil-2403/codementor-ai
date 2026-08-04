import { cn } from '../../utils/cn.js';

export default function SectionHeader({ title, description, actions = null, className = '', ...props }) {
  return <div className={cn('ui-section-header', className)} {...props}>
    <div className="min-w-0">
      <h2 className="ui-section-title">{title}</h2>
      {description && <p className="ui-section-description">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
  </div>;
}
