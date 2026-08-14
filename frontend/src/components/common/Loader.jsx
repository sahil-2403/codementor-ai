export default function Loader({ label = 'Loading...' }) {
  return (
    <div
      className="grid min-h-[75vh] w-full place-items-center"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-hidden="true"
      />
    </div>
  );
}
