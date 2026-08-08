import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  Pencil,
  Plus,
  RotateCcw,
  Tags,
  Trash2
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import {
  useAdminTopicImpact,
  useAdminTopics,
  useDeleteTopic,
  useUpdateTopicStatus
} from '../../queries/adminQueries.js';
import { formatDate } from '../../utils/formatDate.js';

const emptyFilters = {
  page: 1,
  limit: 10,
  search: '',
  difficulty: '',
  status: ''
};

const impactLabels = [
  ['lessons', 'Lessons'],
  ['quizQuestions', 'Quiz questions'],
  ['projects', 'Projects'],
  ['interviewQuestions', 'Interview questions']
];

function ImpactSummary({ impact = {}, destructive = false }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {impactLabels.map(([key, label]) => (
          <div
            key={key}
            className="rounded-surface border border-border bg-surface-secondary/55 px-4 py-3"
          >
            <p className="text-xl font-extrabold tracking-tight text-foreground">
              {impact[key] || 0}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>

      {destructive ? (
        <div className="rounded-surface border border-rose-200 bg-rose-50/70 p-4">
          <p className="text-sm font-bold text-rose-800">
            Learner data affected by permanent deletion
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-700">
            {impact.projectSubmissions || 0} project submission(s) and{' '}
            {impact.interviewAttempts || 0} interview attempt(s) will be deleted.
            {' '}{impact.affectedCoursePlans || 0} saved roadmap(s) will have deleted lesson and quiz references removed.
          </p>
          {impact.quizAttempts ? (
            <p className="mt-2 text-xs leading-5 text-rose-700/90">
              {impact.quizAttempts} historical quiz attempt(s) reference these questions; their saved answer snapshots are kept while the deleted question reference is cleared.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function TopicsPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [actionTarget, setActionTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const topicsQuery = useAdminTopics(filters);
  const updateStatus = useUpdateTopicStatus();
  const deleteTopic = useDeleteTopic();
  const impactQuery = useAdminTopicImpact(
    actionTarget?.topic?._id,
    Boolean(actionTarget)
  );

  if (topicsQuery.isLoading) return <Loader label="Loading topics..." />;

  const topics = topicsQuery.data?.topics || [];
  const impact = impactQuery.data?.impact || {};
  const mutationError =
    updateStatus.error?.message ||
    deleteTopic.error?.message ||
    impactQuery.error?.message ||
    topicsQuery.error?.message;

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
  };

  const closeDialog = () => {
    setActionTarget(null);
    setDeleteConfirmation('');
  };

  const openAction = (mode, topic) => {
    setDeleteConfirmation('');
    setActionTarget({ mode, topic });
  };

  const confirmLifecycle = () => {
    if (!actionTarget?.topic) return;
    const status = actionTarget.mode === 'restore' ? 'active' : 'archived';
    updateStatus.mutate(
      { id: actionTarget.topic._id, status },
      { onSuccess: closeDialog }
    );
  };

  const confirmDelete = () => {
    if (!actionTarget?.topic || deleteConfirmation !== 'DELETE') return;
    deleteTopic.mutate(actionTarget.topic._id, { onSuccess: closeDialog });
  };

  const columns = [
    {
      key: 'title',
      header: 'Topic',
      render: (topic) => (
        <div className="min-w-0">
          <p className="font-bold text-foreground">{topic.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {topic.category} · order {topic.order || 0}
          </p>
        </div>
      )
    },
    {
      key: 'difficulty',
      header: 'Level',
      render: (topic) => (
        <span className="text-sm font-semibold capitalize text-foreground">
          {topic.difficulty}
        </span>
      )
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (topic) => (
        <div className="flex max-w-sm flex-wrap gap-1.5">
          {(topic.tags || []).length ? (
            (topic.tags || []).slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-secondary px-2 py-1 text-[11px] font-semibold text-muted-foreground"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No tags</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (topic) => <StatusPill status={topic.status || 'active'} />
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (topic) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(topic.updatedAt || topic.createdAt)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'px-4 py-3 text-right',
      render: (topic) => {
        const archived = topic.status === 'archived';

        return (
          <div className="flex flex-wrap justify-end gap-2">
            {!archived ? (
              <Link
                to={`/admin/topics/${topic._id}/edit`}
                className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"
              >
                <Pencil size={14} aria-hidden="true" />
                Edit
              </Link>
            ) : null}

            <Button
              type="button"
              variant="secondary"
              className="min-h-9 gap-1.5 px-3 text-xs"
              onClick={() => openAction(archived ? 'restore' : 'archive', topic)}
            >
              {archived ? (
                <RotateCcw size={14} aria-hidden="true" />
              ) : (
                <Archive size={14} aria-hidden="true" />
              )}
              {archived ? 'Restore' : 'Archive'}
            </Button>

            <Button
              type="button"
              variant="danger"
              className="min-h-9 gap-1.5 px-3 text-xs"
              onClick={() => openAction('delete', topic)}
            >
              <Trash2 size={14} aria-hidden="true" />
              Delete
            </Button>
          </div>
        );
      }
    }
  ];

  const isDeleteDialog = actionTarget?.mode === 'delete';
  const isRestoreDialog = actionTarget?.mode === 'restore';
  const lifecycleLabel = isRestoreDialog ? 'Restore topic' : 'Archive topic';

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Content administration"
        eyebrowIcon={Tags}
        title="Topics"
        description="Review the topic library, control content availability, and keep learning content organised."
        actions={
          <Link to="/admin/topics/new" className="ui-button ui-button--primary gap-2">
            <Plus size={16} aria-hidden="true" />
            Create topic
          </Link>
        }
      />

      <ErrorMessage message={mutationError} />

      <Card className="shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
              Topic library
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              Manage learning topics
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {topicsQuery.data?.pagination?.total || 0} topic(s) match the current filters.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-panel border border-border bg-surface-secondary/45 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto]">
          <Input
            label="Search"
            placeholder="Title, category, or tag"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
          <Select
            label="Difficulty"
            value={filters.difficulty}
            onChange={(event) => updateFilter('difficulty', event.target.value)}
          >
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
          <Select
            label="Status"
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full xl:w-auto"
              onClick={() => setFilters(emptyFilters)}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={topics}
            emptyTitle="No topics found"
            emptyDescription="Create a topic or change the current filters."
            minWidth={980}
            label="Admin topic library"
          />
        </div>

        <PaginationControls
          pagination={topicsQuery.data?.pagination}
          setFilters={setFilters}
        />
      </Card>

      <ConfirmDialog
        open={Boolean(actionTarget) && !isDeleteDialog}
        title={`${lifecycleLabel}?`}
        description={
          isRestoreDialog
            ? `Restore “${actionTarget?.topic?.title || ''}”? Content automatically archived by this topic will return to its previous draft or published state. Content that was already manually archived stays archived.`
            : `Archive “${actionTarget?.topic?.title || ''}”? Related lessons, quiz questions, projects, and interview questions will become unavailable until the topic is restored.`
        }
        confirmLabel={lifecycleLabel}
        tone="primary"
        isLoading={updateStatus.isPending}
        confirmDisabled={impactQuery.isLoading || impactQuery.isError}
        loadingLabel={isRestoreDialog ? 'Restoring...' : 'Archiving...'}
        onCancel={closeDialog}
        onConfirm={confirmLifecycle}
      >
        {impactQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Checking related content...</p>
        ) : impactQuery.isError ? (
          <ErrorMessage message={impactQuery.error?.message} />
        ) : (
          <ImpactSummary impact={impact} />
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(actionTarget) && isDeleteDialog}
        title="Delete topic permanently?"
        description={`Delete “${actionTarget?.topic?.title || ''}” and all content related to it. This action cannot be undone.`}
        confirmLabel="Delete permanently"
        tone="danger"
        isLoading={deleteTopic.isPending}
        confirmDisabled={
          impactQuery.isLoading ||
          impactQuery.isError ||
          deleteConfirmation !== 'DELETE'
        }
        loadingLabel="Deleting..."
        onCancel={closeDialog}
        onConfirm={confirmDelete}
      >
        {impactQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Checking deletion impact...</p>
        ) : impactQuery.isError ? (
          <ErrorMessage message={impactQuery.error?.message} />
        ) : (
          <div className="space-y-5">
            <ImpactSummary impact={impact} destructive />
            <Input
              label="Type DELETE to confirm"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>
        )}
      </ConfirmDialog>
    </PageShell>
  );
}
