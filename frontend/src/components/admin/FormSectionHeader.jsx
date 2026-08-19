export default function FormSectionHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-4">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong"
        aria-hidden="true"
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
