export default function CodeBlock({ code, label = 'Code example' }) {
  if (!code) return null;
  return <pre className="overflow-auto rounded-panel border border-slate-800 bg-slate-950 p-5 text-sm leading-7 text-slate-100 shadow-sm" tabIndex={0} aria-label={label}><code>{code}</code></pre>;
}
