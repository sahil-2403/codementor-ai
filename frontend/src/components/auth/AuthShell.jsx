import Card from '../common/Card.jsx';

export default function AuthShell({ icon: Icon, eyebrow = 'Secure account', title, description, children, footer = null }) {
  return <section className="auth-shell" aria-labelledby="auth-title">
    <Card className="auth-card">
      <div className="auth-icon" aria-hidden="true">{Icon && <Icon size={19} />}</div>
      <p className="ui-eyebrow mt-3">{eyebrow}</p>
      <h1 id="auth-title" className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
      {footer && <div className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">{footer}</div>}
    </Card>
  </section>;
}
