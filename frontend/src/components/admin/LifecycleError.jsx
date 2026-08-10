export default function LifecycleError({ error }) {
  if (!error) return null;

  const steps = Array.from(new Set(
    (error.errors || [])
      .map((item) => String(item?.message || '').trim())
      .filter(Boolean)
  ));

  return (
    <div className="ui-alert ui-alert--error space-y-3" role="alert">
      <p className="font-bold">{error.message || 'This action is blocked.'}</p>
      {steps.length ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em]">How to resolve</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-6">
            {steps.map((step) => <li key={step}>• {step}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
