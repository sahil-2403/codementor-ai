import Button from '../common/Button.jsx';

export default function PaginationControls({ pagination, setFilters, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const goToPage = (page) => {
    if (onPageChange) return onPageChange(page);
    if (setFilters) return setFilters((prev) => ({ ...prev, page }));
  };

  return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/60 px-4 py-3 text-sm text-slate-600">
    <span>Page <b>{pagination.page}</b> of <b>{pagination.totalPages}</b> · {pagination.total} records</span>
    <div className="flex gap-2">
      <Button type="button" variant="secondary" disabled={!pagination.hasPrevPage} onClick={() => goToPage(Math.max((pagination.page || 1) - 1, 1))}>Previous</Button>
      <Button type="button" variant="secondary" disabled={!pagination.hasNextPage} onClick={() => goToPage((pagination.page || 1) + 1)}>Next</Button>
    </div>
  </div>;
}
