export default function SectionHeader({ title, description, actions = null }) {
  return <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
    <div>
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>;
}
