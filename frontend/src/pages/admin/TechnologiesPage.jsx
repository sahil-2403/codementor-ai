import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Boxes, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { TECHNOLOGY_TYPES, labelFor } from '../../constants/catalog.js';
import { useAdminTechnologies, useDeleteTechnology, useUpdateTechnologyStatus } from '../../queries/adminQueries.js';

const initialFilters = { page: 1, limit: 50, search: '', status: '', type: '' };

export default function TechnologiesPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const query = useAdminTechnologies(filters);
  const updateStatus = useUpdateTechnologyStatus();
  const deleteTechnology = useDeleteTechnology();

  if (query.isLoading) return <Loader label="Loading technologies..." />;
  const technologies = query.data?.technologies || [];
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const actionLabel = statusTarget?.status === 'published' ? 'Publish' : statusTarget?.status === 'draft' ? 'Restore to Draft' : 'Archive';

  return (
    <PageShell className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Learning catalog"
        eyebrowIcon={Boxes}
        title="Technologies"
        description="Manage the languages, frameworks, runtimes, databases, and tools used to classify courses."
        actions={<Link to="/admin/technologies/new" className="ui-button ui-button--primary gap-2"><Plus size={16} aria-hidden="true" /> Add technology</Link>}
      />
      <ErrorMessage message={query.error?.message} />

      <Card className="shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="JavaScript, React, PostgreSQL..." />
          <Select label="Type" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
            <option value="">All types</option>
            {TECHNOLOGY_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select label="Status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
          </Select>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {technologies.length ? technologies.map((technology) => {
          const archived = technology.status === 'archived';
          return <Card key={technology._id} className="min-w-0 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-lg font-bold text-foreground">{technology.name}</h2><StatusPill status={technology.status} /></div>
                <p className="mt-1 text-xs font-semibold text-primary-strong">{labelFor(TECHNOLOGY_TYPES, technology.type)}</p>
              </div>
              <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">#{technology.order || 0}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{technology.description || 'No description yet.'}</p>
            {technology.parentTechnology ? <p className="mt-3 text-xs text-muted-foreground">Parent: <strong className="text-foreground">{technology.parentTechnology.name}</strong></p> : null}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              {!archived ? <Link to={`/admin/technologies/${technology._id}/edit`} className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"><Pencil size={14} /> Edit</Link> : null}
              {technology.status === 'draft' ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setStatusTarget({ item: technology, status: 'published' })}>Publish</Button> : null}
              {!archived ? <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => setStatusTarget({ item: technology, status: 'archived' })}><Archive size={14} /> Archive</Button> : <Button variant="secondary" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => setStatusTarget({ item: technology, status: 'draft' })}><RotateCcw size={14} /> Restore</Button>}
              {technology.status !== 'published' ? <Button variant="danger" className="min-h-9 gap-1.5 px-3 text-xs" onClick={() => { setDeleteTarget(technology); setDeleteConfirmation(''); }}><Trash2 size={14} /> Delete</Button> : null}
            </div>
          </Card>;
        }) : <div className="md:col-span-2 xl:col-span-3"><EmptyState title="No technologies found" description="Create the first technology or change the filters." /></div>}
      </div>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={`${actionLabel} technology?`}
        description={statusTarget?.status === 'published'
          ? 'Published technologies become available in learner discovery and published Course configuration.'
          : statusTarget?.status === 'draft'
            ? 'Restoring returns this technology to Draft. Review it before publishing it again.'
            : 'Archiving hides this technology from new catalog use. Existing dependent courses must be handled before permanent deletion.'}
        confirmLabel={actionLabel}
        tone="primary"
        isLoading={updateStatus.isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => updateStatus.mutate({ id: statusTarget.item._id, status: statusTarget.status, confirmPublish: statusTarget.status === 'published' }, { onSuccess: () => setStatusTarget(null) })}
      ><ErrorMessage message={updateStatus.error?.message} /></ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete technology permanently?"
        description={`Delete “${deleteTarget?.name || ''}”. The backend will refuse deletion while courses or learning paths still depend on it.`}
        confirmLabel="Delete permanently"
        tone="danger"
        isLoading={deleteTechnology.isPending}
        confirmDisabled={deleteConfirmation !== 'DELETE'}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTechnology.mutate(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) })}
      >
        <Input label="Type DELETE to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} />
        <ErrorMessage message={deleteTechnology.error?.message} />
      </ConfirmDialog>
    </PageShell>
  );
}
