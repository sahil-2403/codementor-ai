import { useState } from 'react';
import AdminLifecycleGuide from '../../components/admin/AdminLifecycleGuide.jsx';
import AdminFilters from '../../components/admin/AdminFilters.jsx';
import LessonForm from '../../components/admin/LessonForm.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import SectionHeader from '../../components/common/SectionHeader.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { useAdminLessons, useAdminTopics, useArchiveLesson, useCreateLesson, useUpdateLesson, useUpdateLessonStatus } from '../../queries/adminQueries.js';
import { formatDate } from '../../utils/formatDate.js';

export default function LessonsPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 8, search: '', status: '', difficulty: '', topic: '' });
  const [editing, setEditing] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const { data, isLoading } = useAdminLessons(filters);
  const topics = useAdminTopics({ limit: 100, status: 'active' });
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const updateStatus = useUpdateLessonStatus();
  const archiveLesson = useArchiveLesson();

  if (isLoading || topics.isLoading) return <Loader label="Loading lessons..." />;

  const lessons = data?.lessons || [];
  const errorMessage = topics.error?.message || createLesson.error?.message || updateLesson.error?.message || updateStatus.error?.message || archiveLesson.error?.message;
  const submit = (payload) => {
    if (editing) updateLesson.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) });
    else createLesson.mutate(payload);
  };

  const columns = [
    { key: 'lesson', header: 'Lesson', render: (lesson) => <div><b className="text-foreground">{lesson.title}</b><p className="line-clamp-2 max-w-xs text-xs text-muted-foreground">{lesson.theory}</p></div> },
    { key: 'topic', header: 'Topic', render: (lesson) => lesson.topic?.title || 'No topic' },
    { key: 'difficulty', header: 'Level', render: (lesson) => <span className="capitalize">{lesson.difficulty}</span> },
    { key: 'status', header: 'Status', render: (lesson) => <StatusPill status={lesson.status} /> },
    { key: 'updatedAt', header: 'Updated', render: (lesson) => formatDate(lesson.updatedAt || lesson.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'px-4 py-3 text-right',
      render: (lesson) => <div className="flex flex-wrap justify-end gap-2">
        {lesson.status !== 'archived' ? <Button type="button" variant="ghost" onClick={() => setEditing(lesson)}>Edit</Button> : null}
        {lesson.status === 'draft' ? <Button type="button" variant="secondary" onClick={() => setPublishTarget(lesson)}>Publish</Button> : null}
        {lesson.status !== 'archived' ? <Button type="button" variant="secondary" onClick={() => setArchiveTarget(lesson)}>Archive</Button> : null}
      </div>
    }
  ];

  return <PageShell>
    <PageHeader eyebrow="Content administration" title="Lessons" description="Create, review, publish, and archive the lessons learners see in their roadmaps." />
    <AdminLifecycleGuide />
    <ErrorMessage message={errorMessage} />
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
      <Card>
        <SectionHeader title={editing ? 'Edit lesson' : 'Create lesson draft'} description="Add a topic, clear lesson content, code guidance, and interview questions before publishing." />
        <div className="mt-4"><LessonForm topics={topics.data?.topics || []} initialData={editing} onSubmit={submit} onCancel={editing ? () => setEditing(null) : null} isLoading={createLesson.isPending || updateLesson.isPending} /></div>
      </Card>
      <Card>
        <SectionHeader title="Lessons" description={`${data?.pagination?.total || 0} lessons in the content library.`} />
        <div className="mt-4"><AdminFilters filters={filters} setFilters={setFilters} topics={topics.data?.topics || []} /></div>
        <div className="mt-4"><DataTable columns={columns} rows={lessons} emptyTitle="No lessons found" emptyDescription="Create a lesson or adjust the filters." minWidth={900} /></div>
        <PaginationControls pagination={data?.pagination} setFilters={setFilters} />
      </Card>
    </div>

    <ConfirmDialog
      open={Boolean(publishTarget)}
      title="Publish lesson?"
      description={`Publish “${publishTarget?.title}” after checking its topic and required learning content. Learners can use it immediately.`}
      confirmLabel="Publish lesson"
      tone="primary"
      isLoading={updateStatus.isPending}
      onCancel={() => setPublishTarget(null)}
      onConfirm={() => updateStatus.mutate({ id: publishTarget._id, status: 'published', confirmPublish: true }, { onSuccess: () => setPublishTarget(null) })}
    />
    <ConfirmDialog
      open={Boolean(archiveTarget)}
      title="Archive lesson?"
      description={`This hides “${archiveTarget?.title}” from learners and keeps it as read-only history.`}
      confirmLabel="Archive lesson"
      isLoading={archiveLesson.isPending}
      onCancel={() => setArchiveTarget(null)}
      onConfirm={() => archiveLesson.mutate(archiveTarget._id, { onSuccess: () => setArchiveTarget(null) })}
    />
  </PageShell>;
}
