import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';

export default function AdminFilters({
  filters,
  setFilters,
  topics = [],
  includeType = false,
  includeTopic = true,
  includeRole = false,
  includeFeature = false
}) {
  const update = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const reset = () => {
    setFilters({ page: 1, limit: filters.limit || 10 });
  };

  return (
    <div className="grid gap-3 rounded-surface border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-5">
      <Input
        label="Search"
        value={filters.search || ''}
        onChange={(event) => update('search', event.target.value)}
        placeholder="Search..."
      />

      {includeTopic ? (
        <Select
          label="Topic"
          value={filters.topic || ''}
          onChange={(event) => update('topic', event.target.value)}
        >
          <option value="">All topics</option>
          {topics.map((topic) => (
            <option key={topic._id} value={topic._id}>{topic.title}</option>
          ))}
        </Select>
      ) : null}

      {!includeRole && !includeFeature ? (
        <Select
          label="Difficulty"
          value={filters.difficulty || ''}
          onChange={(event) => update('difficulty', event.target.value)}
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
      ) : null}

      {includeType ? (
        <Select
          label="Type"
          value={filters.type || ''}
          onChange={(event) => update('type', event.target.value)}
        >
          <option value="">All types</option>
          <option value="mcq">MCQ</option>
          <option value="code_output">Code output</option>
          <option value="short_answer">Short answer</option>
        </Select>
      ) : null}

      {includeRole ? (
        <Select
          label="Role"
          value={filters.role || ''}
          onChange={(event) => update('role', event.target.value)}
        >
          <option value="">All roles</option>
          <option value="learner">Learner</option>
          <option value="admin">Admin</option>
        </Select>
      ) : null}

      {includeFeature ? (
        <Input
          label="Feature"
          value={filters.feature || ''}
          onChange={(event) => update('feature', event.target.value)}
          placeholder="mentor_chat"
        />
      ) : null}

      {!includeRole ? (
        <Select
          label="Status"
          value={filters.status || ''}
          onChange={(event) => update('status', event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      ) : null}

      <div className="flex items-end">
        <Button type="button" variant="secondary" className="w-full" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
