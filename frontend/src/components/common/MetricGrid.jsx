export default function MetricGrid({ children, columns = 'md:grid-cols-4', className = '' }) {
  return <div className={`grid gap-5 ${columns} ${className}`}>{children}</div>;
}
