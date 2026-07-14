import { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import SectionHeader from '../../components/common/SectionHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import LessonForm from '../../components/admin/LessonForm.jsx';
import AdminFilters from '../../components/admin/AdminFilters.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { useAdminLessons, useAdminTopics, useCreateLesson, useUpdateLesson, useUpdateLessonStatus, useArchiveLesson } from '../../queries/adminQueries.js';

export default function LessonsPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 8, search: '', status: '', difficulty: '', topic: '' });
  const [editing, setEditing] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(null);
  const { data, isLoading } = useAdminLessons(filters);
  const topics = useAdminTopics({ limit: 100 });
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const updateStatus = useUpdateLessonStatus();
  const archiveLesson = useArchiveLesson();
  if (isLoading || topics.isLoading) return <Loader />;
  const lessons = data?.lessons || [];
  const submit = (payload) => {
    if (editing) updateLesson.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) });
    else createLesson.mutate(payload);
  };

  const columns = [
    { key: 'lesson', header: 'Lesson', render: (lesson) => <div><b>{lesson.title}</b><p className="line-clamp-2 max-w-xs text-xs text-slate-500">{lesson.theory}</p></div> },
    { key: 'topic', header: 'Topic', render: (lesson) => lesson.topic?.title || 'No topic' },
    { key: 'difficulty', header: 'Level', render: (lesson) => <span className="capitalize">{lesson.difficulty}</span> },
    { key: 'status', header: 'Status', render: (lesson) => <StatusPill status={lesson.status} /> },
    { key: 'updatedAt', header: 'Updated', render: (lesson) => formatDate(lesson.updatedAt || lesson.createdAt) },
    { key: 'actions', header: 'Actions', cellClassName: 'px-4 py-3 text-right', render: (lesson) => <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEditing(lesson)}>Edit</Button>{lesson.status !== 'published' && <Button type="button" variant="secondary" onClick={() => updateStatus.mutate({ id: lesson._id, status: 'published' })}>Publish</Button>}{lesson.status !== 'draft' && <Button type="button" variant="secondary" onClick={() => updateStatus.mutate({ id: lesson._id, status: 'draft' })}>Draft</Button>}{lesson.status !== 'archived' && <Button type="button" variant="secondary" onClick={() => setConfirmArchive(lesson)}>Archive</Button>}</div> }
  ];

  return <PageShell>
    <PageHeader eyebrow="Admin CMS" title="Lesson CMS" description="Create, edit, publish, unpublish, archive, search, and filter learning content from one consistent admin workflow." />
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
      <Card><SectionHeader title={editing ? 'Edit lesson' : 'Create lesson'} description="Use draft status for unfinished content and publish only reviewed lessons." /><div className="mt-4"><LessonForm topics={topics.data?.topics || []} initialData={editing} onSubmit={submit} onCancel={editing ? () => setEditing(null) : null} isLoading={createLesson.isPending || updateLesson.isPending} /></div></Card>
      <Card>
        <SectionHeader title="Lessons" description={`${data?.pagination?.total || 0} lessons in content library.`} />
        <div className="mt-4"><AdminFilters filters={filters} setFilters={setFilters} topics={topics.data?.topics || []} /></div>
        <div className="mt-4"><DataTable columns={columns} rows={lessons} emptyTitle="No lessons found" emptyDescription="Create a lesson or adjust your filters." minWidth={900} /></div>
        <PaginationControls pagination={data?.pagination} setFilters={setFilters} />
      </Card>
    </div>
    <ConfirmDialog open={Boolean(confirmArchive)} title="Archive lesson?" description={`This will hide “${confirmArchive?.title}” from learner-facing flows but keep it available in admin history.`} confirmLabel="Archive lesson" isLoading={archiveLesson.isPending} onCancel={() => setConfirmArchive(null)} onConfirm={() => archiveLesson.mutate(confirmArchive._id, { onSuccess: () => setConfirmArchive(null) })} />
  </PageShell>;
}
