export default function AdminFilterPanel({ children, columnsClassName = 'xl:grid-cols-5' }) {
  return (
    <div className={`grid gap-3 rounded-surface border border-border bg-surface p-4 sm:grid-cols-2 ${columnsClassName}`}>
      {children}
    </div>
  );
}
