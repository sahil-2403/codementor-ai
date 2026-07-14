import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';

export default function AdminFilters({ filters, setFilters, topics = [], includeType = false, includeTopic = true, includeRole = false, includeFeature = false }) {
  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  return <div className="grid gap-3 rounded-[2rem] bg-white/70 p-4 md:grid-cols-5">
    <Input label="Search" value={filters.search || ''} onChange={(e) => update('search', e.target.value)} placeholder="Search..." />
    {includeTopic && <Select label="Topic" value={filters.topic || ''} onChange={(e) => update('topic', e.target.value)}><option value="">All topics</option>{topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</Select>}
    {!includeRole && !includeFeature && <Select label="Difficulty" value={filters.difficulty || ''} onChange={(e) => update('difficulty', e.target.value)}><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>}
    {includeType && <Select label="Type" value={filters.type || ''} onChange={(e) => update('type', e.target.value)}><option value="">All types</option><option value="mcq">MCQ</option><option value="code_output">Code output</option><option value="short_answer">Short answer</option></Select>}
    {includeRole && <Select label="Role" value={filters.role || ''} onChange={(e) => update('role', e.target.value)}><option value="">All roles</option><option value="learner">Learner</option><option value="admin">Admin</option></Select>}
    {includeFeature && <Input label="Feature" value={filters.feature || ''} onChange={(e) => update('feature', e.target.value)} placeholder="mentor_chat" />}
    {!includeRole && <Select label="Status" value={filters.status || ''} onChange={(e) => update('status', e.target.value)}><option value="">All status</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select>}
    <div className="flex items-end"><Button type="button" variant="secondary" className="w-full" onClick={() => setFilters({ page: 1, limit: filters.limit || 10 })}>Reset</Button></div>
  </div>;
}
