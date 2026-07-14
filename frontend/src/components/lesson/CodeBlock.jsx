export default function CodeBlock({ code }) {
  if (!code) return null;
  return <pre className="overflow-auto rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-100"><code>{code}</code></pre>;
}
