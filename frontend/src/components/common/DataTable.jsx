import { cn } from '../../utils/cn.js';
import EmptyState from './EmptyState.jsx';
import Loader from './Loader.jsx';

export default function DataTable({ columns, rows = [], getRowKey = (row) => row._id, isLoading = false, emptyTitle = 'No records found', emptyDescription = 'Try changing your filters.', minWidth = 800, label = 'Data table', caption }) {
  if (isLoading) return <Loader label="Loading records..." />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return <div className="ui-table-shell" role="region" aria-label={label} tabIndex={0}>
    <table className="ui-table" style={{ minWidth }}>
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead className="ui-table-head">
        <tr>{columns.map((column) => <th key={column.key} scope="col" className={cn('ui-table-heading', column.className)}>{column.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => <tr key={getRowKey(row)} className="ui-table-row">
          {columns.map((column) => <td key={column.key} className={cn('ui-table-cell', column.cellClassName)}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}
      </tbody>
    </table>
  </div>;
}
