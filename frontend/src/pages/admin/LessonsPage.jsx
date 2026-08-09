import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  BookOpenText,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Tags,
  Trash2
} from 'lucide-react';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
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
import {
  useAdminLessonImpact,
  useAdminLessons,
  useAdminTopics,
  useDeleteLesson,
  useUpdateLessonStatus
} from '../../queries/adminQueries.js';
import { formatDate } from '../../utils/formatDate.js';

const emptyFilters = {
  page: 1,
  limit: 10,
  search: '',
  status: '',
  difficulty: '',
  topic: ''
};

function LessonImpactSummary({ impact = {}, destructive = false }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-surface border border-border bg-surface-secondary/55 px-4 py-3">
          <p className="text-xl font-extrabold tracking-tight text-foreground">
            {impact.quizQuestions || 0}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Related quiz questions</p>
        </div>
        <div className="rounded-surface border border-border bg-surface-secondary/55 px-4 py-3">
          <p className="text-xl font-extrabold tracking-tight text-foreground">
            {impact.projects || 0}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Related projects</p>
        </div>
      </div>

      {destructive ? (
        <div className="rounded-surface border border-rose-200 bg-rose-50/70 p-4">
          <p className="text-sm font-bold text-rose-800">Learner data affected by permanent deletion</p>
          <p className="mt-2 text-sm leading-6 text-rose-700">
            {impact.projectSubmissions || 0} project submission(s) will be deleted and{' '}
            {impact.affectedCoursePlans || 0} saved roadmap(s) will have this lesson and its related quiz references removed.
          </p>
          <p className="mt-2 text-xs leading-5 text-rose-700/90">
            {impact.quizAttempts || 0} historical quiz attempt(s) may reference related questions; their saved answer snapshots are kept while deleted question references are cleared. {impact.progressRecords || 0} progress record(s), {impact.revisionItems || 0} revision item(s), and {impact.weeklyReports || 0} weekly report(s) reference this lesson and will be cleaned.
          </p>
          {impact.projects ? (
            <p className="mt-2 text-xs font-semibold leading-5 text-rose-800">
              Related projects are deleted completely even when they also reference other lessons.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function LessonsPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [actionTarget, setActionTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const lessonsQuery = useAdminLessons(filters);
  const topicsQuery = useAdminTopics({ limit: 100 });
  const updateStatus = useUpdateLessonStatus();
  const deleteLesson = useDeleteLesson();
  const needsImpact = ['archive', 'restore', 'delete'].includes(actionTarget?.mode);
  const impactQuery = useAdminLessonImpact(
    actionTarget?.lesson?._id,
    Boolean(actionTarget?.lesson) && needsImpact
  );

  if (lessonsQuery.isLoading || topicsQuery.isLoading) {
    return <Loader label="Loading lessons..." />;
  }

  const lessons = lessonsQuery.data?.lessons || [];
  const topics = topicsQuery.data?.topics || [];
  const impact = impactQuery.data?.impact || {};
  const errorMessage =
    lessonsQuery.error?.message ||
    topicsQuery.error?.message ||
    updateStatus.error?.message ||
    deleteLesson.error?.message ||
    impactQuery.error?.message;

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
  };

  const openAction = (mode, lesson) => {
    setDeleteConfirmation('');
    setActionTarget({ mode, lesson });
  };

  const closeDialog = () => {
    setActionTarget(null);
    setDeleteConfirmation('');
  };

  const confirmStatusAction = () => {
    if (!actionTarget?.lesson) return;

    if (actionTarget.mode === 'publish') {
      updateStatus.mutate(
        { id: actionTarget.lesson._id, status: 'published', confirmPublish: true },
        { onSuccess: closeDialog }
      );
      return;
    }

    updateStatus.mutate(
      {
        id: actionTarget.lesson._id,
        status: actionTarget.mode === 'restore' ? 'restored' : 'archived'
      },
      { onSuccess: closeDialog }
    );
  };

  const confirmDelete = () => {
    if (!actionTarget?.lesson || deleteConfirmation !== 'DELETE') return;
    deleteLesson.mutate(actionTarget.lesson._id, { onSuccess: closeDialog });
  };

  const columns = [
    {
      key: 'lesson',
      header: 'Lesson',
      render: (lesson) => (
        <div className="min-w-0">
          <p className="font-bold text-foreground">{lesson.title}</p>
          <p className="mt-1 line-clamp-2 max-w-sm text-xs leading-5 text-muted-foreground">
            {lesson.theory}
          </p>
        </div>
      )
    },
    {
      key: 'topic',
      header: 'Topic',
      render: (lesson) => (
        <div>
          <p className="text-sm font-semibold text-foreground">{lesson.topic?.title || 'No topic'}</p>
          {lesson.topic?.status === 'archived' ? (
            <p className="mt-1 text-xs font-semibold text-amber-700">Topic archived</p>
          ) : null}
        </div>
      )
    },
    {
      key: 'difficulty',
      header: 'Level',
      render: (lesson) => <span className="text-sm font-semibold capitalize">{lesson.difficulty}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (lesson) => {
        const topicBlocked = Boolean(lesson.archivedByTopics?.length);
        return (
          <div>
            <StatusPill status={lesson.status} />
            {topicBlocked ? (
              <p className="mt-1 text-[11px] font-semibold text-muted-foreground">By parent topic</p>
            ) : null}
          </div>
        );
      }
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (lesson) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(lesson.updatedAt || lesson.createdAt)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'px-4 py-3 text-right',
      render: (lesson) => {
        const archived = lesson.status === 'archived';
        const topicBlocked = Boolean(lesson.archivedByTopics?.length);

        return (
          <div className="flex flex-wrap justify-end gap-2">
            {!archived ? (
              <Link
                to={`/admin/lessons/${lesson._id}/edit`}
                className="ui-button ui-button--ghost min-h-9 gap-1.5 px-3 text-xs"
              >
                <Pencil size={14} aria-hidden="true" />
                Edit
              </Link>
            ) : null}

            {lesson.status === 'draft' ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-9 gap-1.5 px-3 text-xs"
                onClick={() => openAction('publish', lesson)}
              >
                <Send size={14} aria-hidden="true" />
                Publish
              </Button>
            ) : null}

            {!archived ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-9 gap-1.5 px-3 text-xs"
                onClick={() => openAction('archive', lesson)}
              >
                <Archive size={14} aria-hidden="true" />
                Archive
              </Button>
            ) : topicBlocked ? (
              <Link
                to="/admin/topics"
                className="ui-button ui-button--secondary min-h-9 gap-1.5 px-3 text-xs"
              >
                <Tags size={14} aria-hidden="true" />
                Manage topic
              </Link>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="min-h-9 gap-1.5 px-3 text-xs"
                onClick={() => openAction('restore', lesson)}
              >
                <RotateCcw size={14} aria-hidden="true" />
                Restore
              </Button>
            )}

            <Button
              type="button"
              variant="danger"
              className="min-h-9 gap-1.5 px-3 text-xs"
              onClick={() => openAction('delete', lesson)}
            >
              <Trash2 size={14} aria-hidden="true" />
              Delete
            </Button>
          </div>
        );
      }
    }
  ];

  const isPublish = actionTarget?.mode === 'publish';
  const isDelete = actionTarget?.mode === 'delete';
  const isRestore = actionTarget?.mode === 'restore';

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Content administration"
        eyebrowIcon={BookOpenText}
        title="Lessons"
        description="Review lesson content, manage learner availability, and control dependent quiz and project content."
        actions={
          <Link to="/admin/lessons/new" className="ui-button ui-button--primary gap-2">
            <Plus size={16} aria-hidden="true" />
            Create lesson
          </Link>
        }
      />

      <ErrorMessage message={errorMessage} />

      <Card className="shadow-sm">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
            Lesson library
          </p>
          <h2 className="mt-1 text-xl font-bold text-foreground">Manage learning lessons</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {lessonsQuery.data?.pagination?.total || 0} lesson(s) match the current filters.
          </p>
        </div>

        <div className="mt-5 grid gap-3 rounded-panel border border-border bg-surface-secondary/45 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_1fr_1fr_1fr_auto]">
          <Input
            label="Search"
            placeholder="Title, theory, or tag"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
          <Select
            label="Topic"
            value={filters.topic}
            onChange={(event) => updateFilter('topic', event.target.value)}
          >
            <option value="">All topics</option>
            {topics.map((topic) => (
              <option key={topic._id} value={topic._id}>
                {topic.title}{topic.status === 'archived' ? ' (Archived)' : ''}
              </option>
            ))}
          </Select>
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
            <option value="draft">Draft</option>
            <option value="published">Published</option>
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
            rows={lessons}
            emptyTitle="No lessons found"
            emptyDescription="Create a lesson draft or change the current filters."
            minWidth={1050}
            label="Admin lesson library"
          />
        </div>

        <PaginationControls
          pagination={lessonsQuery.data?.pagination}
          setFilters={setFilters}
        />
      </Card>

      <ConfirmDialog
        open={Boolean(actionTarget) && isPublish}
        title="Publish lesson?"
        description={`Publish “${actionTarget?.lesson?.title || ''}” after checking its learning content. Learners can use it immediately.`}
        confirmLabel="Publish lesson"
        tone="primary"
        isLoading={updateStatus.isPending}
        loadingLabel="Publishing..."
        onCancel={closeDialog}
        onConfirm={confirmStatusAction}
      />

      <ConfirmDialog
        open={Boolean(actionTarget) && !isPublish && !isDelete}
        title={isRestore ? 'Restore lesson?' : 'Archive lesson?'}
        description={
          isRestore
            ? `Restore “${actionTarget?.lesson?.title || ''}”? Related quiz questions and projects automatically archived by this lesson will return to their previous state when no other archive blockers remain.`
            : `Archive “${actionTarget?.lesson?.title || ''}”? The lesson and its related quiz questions and projects will become unavailable to learners until restored.`
        }
        confirmLabel={isRestore ? 'Restore lesson' : 'Archive lesson'}
        tone="primary"
        isLoading={updateStatus.isPending}
        confirmDisabled={impactQuery.isLoading || impactQuery.isError}
        loadingLabel={isRestore ? 'Restoring...' : 'Archiving...'}
        onCancel={closeDialog}
        onConfirm={confirmStatusAction}
      >
        {impactQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Checking related content...</p>
        ) : impactQuery.isError ? (
          <ErrorMessage message={impactQuery.error?.message} />
        ) : (
          <LessonImpactSummary impact={impact} />
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(actionTarget) && isDelete}
        title="Delete lesson permanently?"
        description={`Delete “${actionTarget?.lesson?.title || ''}” and all Lesson-owned quiz questions and projects. This action cannot be undone.`}
        confirmLabel="Delete permanently"
        tone="danger"
        isLoading={deleteLesson.isPending}
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
            <LessonImpactSummary impact={impact} destructive />
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
