import EmptyState from './EmptyState.jsx';
import Loader from './Loader.jsx';

export default function DataTable({ columns, rows = [], getRowKey = (row) => row._id, isLoading = false, emptyTitle = 'No records found', emptyDescription = 'Try changing your filters.', minWidth = 800 }) {
  if (isLoading) return <Loader label="Loading records..." />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <div className="overflow-auto rounded-3xl border border-slate-100 bg-white/70">
    <table className="w-full text-left text-sm" style={{ minWidth }}>
      <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
        <tr>{columns.map((column) => <th key={column.key} className={column.className || 'px-4 py-3'}>{column.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => <tr key={getRowKey(row)} className="border-t border-slate-100 align-top transition hover:bg-white">
          {columns.map((column) => <td key={column.key} className={column.cellClassName || 'px-4 py-3'}>{column.render ? column.render(row) : row[column.key]}</td>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
}
