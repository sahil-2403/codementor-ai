import Card from '../common/Card.jsx';

export default function AuthShell({ icon: Icon, eyebrow = 'Secure account', title, description, children, footer = null }) {
  return <section className="auth-shell" aria-labelledby="auth-title">
    <Card className="auth-card">
      <div className="auth-icon" aria-hidden="true">{Icon && <Icon size={22} />}</div>
      <p className="ui-eyebrow mt-5">{eyebrow}</p>
      <h1 id="auth-title" className="mt-1 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 leading-7 text-muted-foreground">{description}</p>}
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">{footer}</div>}
    </Card>
  </section>;
}
