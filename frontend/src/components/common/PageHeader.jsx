import { cn } from '../../utils/cn.js';

export default function PageHeader({ eyebrow, title, description, actions = null, className = '', ...props }) {
  return <header className={cn('ui-page-header', className)} {...props}>
    <div className="min-w-0">
      {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
      <h1 className="ui-page-title">{title}</h1>
      {description && <p className="ui-page-description">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
  </header>;
}
