import { cn } from '../../utils/cn.js';

export default function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon = null,
  title,
  description,
  actions = null,
  variant = 'default',
  className = '',
  ...props
}) {
  const compact = variant === 'compact';

  return (
    <header
      className={cn(
        compact
          ? 'flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between'
          : 'ui-page-header',
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p
            className={cn(
              compact
                ? 'inline-flex flex-wrap items-center gap-1.5 text-xs font-semibold text-primary-strong'
                : 'ui-eyebrow',
            )}
          >
            {EyebrowIcon && <EyebrowIcon size={14} className="shrink-0" aria-hidden="true" />}
            <span>{eyebrow}</span>
          </p>
        )}
        <h1
          className={cn(
            compact
              ? 'mt-2 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl'
              : 'ui-page-title',
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              compact
                ? 'mt-1 max-w-3xl text-sm leading-5 text-muted-foreground sm:leading-6'
                : 'ui-page-description',
            )}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
