import { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import SectionHeader from '../../components/common/SectionHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import { useAdminTopics, useCreateTopic, useUpdateTopic, useDeleteTopic } from '../../queries/adminQueries.js';

const emptyForm = { title: '', category: 'javascript', difficulty: 'beginner', tags: '', order: 0 };
const toForm = (topic) => topic ? { title: topic.title || '', category: topic.category || '', difficulty: topic.difficulty || 'beginner', tags: (topic.tags || []).join(', '), order: topic.order || 0 } : emptyForm;

export default function TopicsPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', difficulty: '' });
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { data, isLoading } = useAdminTopics(filters);
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  if (isLoading) return <Loader label="Loading topics..." />;
  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form, order: Number(form.order) || 0, tags: form.tags.split(',').map((x) => x.trim()).filter(Boolean) };
    if (editing) updateTopic.mutate({ id: editing._id, payload }, { onSuccess: () => { setEditing(null); setForm(emptyForm); } });
    else createTopic.mutate(payload, { onSuccess: () => setForm(emptyForm) });
  };
  const startEdit = (topic) => { setEditing(topic); setForm(toForm(topic)); };
  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  const columns = [
    { key: 'title', header: 'Topic', render: (topic) => <div><b>{topic.title}</b><p className="text-xs text-slate-500">{topic.category} · order {topic.order}</p></div> },
    { key: 'difficulty', header: 'Level', render: (topic) => <StatusPill status={topic.difficulty} /> },
    { key: 'tags', header: 'Tags', render: (topic) => <div className="flex max-w-md flex-wrap gap-1">{(topic.tags || []).slice(0, 5).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">#{tag}</span>)}</div> },
    { key: 'actions', header: 'Actions', cellClassName: 'px-4 py-3 text-right', render: (topic) => <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => startEdit(topic)}>Edit</Button><Button type="button" variant="secondary" onClick={() => setConfirmDelete(topic)}>Delete</Button></div> }
  ];
  return <PageShell>
    <PageHeader eyebrow="Content administration" title="Topics" description="Organise the topics used across lessons, questions, and learning recommendations." />
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card><SectionHeader title={editing ? 'Edit topic' : 'Create topic'} description="Topics keep related lessons, questions, and learner recommendations organised." /><form onSubmit={submit} className="mt-4 space-y-3"><Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /><Select label="Difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Input label="Order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /><Input label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /><div className="flex gap-2"><Button disabled={createTopic.isPending || updateTopic.isPending}>{editing ? 'Update' : 'Create'}</Button>{editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</Button>}</div></form></Card>
      <Card><SectionHeader title="Topic library" description={`${data?.pagination?.total || 0} topics found.`} /><div className="mt-4 grid gap-3 rounded-[2rem] bg-white/70 p-4 md:grid-cols-3"><Input label="Search" value={filters.search} onChange={(e) => update('search', e.target.value)} /><Select label="Difficulty" value={filters.difficulty} onChange={(e) => update('difficulty', e.target.value)}><option value="">All</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><div className="flex items-end"><Button type="button" variant="secondary" className="w-full" onClick={() => setFilters({ page: 1, limit: 10, search: '', difficulty: '' })}>Reset</Button></div></div><div className="mt-4"><DataTable columns={columns} rows={data?.topics || []} emptyTitle="No topics found" emptyDescription="Create a topic or change your filters." minWidth={760} /></div><PaginationControls pagination={data?.pagination} setFilters={setFilters} /></Card>
    </div>
    <ConfirmDialog open={Boolean(confirmDelete)} title="Delete topic?" description={`Delete “${confirmDelete?.title}” only if it is not used by a lesson or question. Topics in use cannot be deleted.`} confirmLabel="Delete topic" isLoading={deleteTopic.isPending} onCancel={() => setConfirmDelete(null)} onConfirm={() => deleteTopic.mutate(confirmDelete._id, { onSuccess: () => setConfirmDelete(null) })} />
  </PageShell>;
}
