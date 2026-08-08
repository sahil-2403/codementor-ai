import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Tags } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import {
  useAdminTopic,
  useCreateTopic,
  useUpdateTopic
} from '../../queries/adminQueries.js';

const emptyForm = {
  title: '',
  category: 'javascript',
  difficulty: 'beginner',
  order: 0,
  tags: ''
};

const toForm = (topic) => ({
  title: topic?.title || '',
  category: topic?.category || '',
  difficulty: topic?.difficulty || 'beginner',
  order: topic?.order || 0,
  tags: (topic?.tags || []).join(', ')
});

export default function TopicEditorPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(topicId);
  const topicQuery = useAdminTopic(topicId);
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (topicQuery.data?.topic) setForm(toForm(topicQuery.data.topic));
  }, [topicQuery.data?.topic]);

  if (isEditing && topicQuery.isLoading) {
    return <Loader label="Loading topic..." />;
  }

  if (isEditing && topicQuery.error) {
    return (
      <EmptyState
        title="Topic is unavailable"
        description={topicQuery.error.message}
        actionLabel="Back to topics"
        onAction={() => navigate('/admin/topics')}
      />
    );
  }

  const topic = topicQuery.data?.topic || null;
  const archived = topic?.status === 'archived';
  const mutation = isEditing ? updateTopic : createTopic;
  const errorMessage = mutation.error?.message;

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const payload = {
      title: form.title,
      category: form.category,
      difficulty: form.difficulty,
      order: Number(form.order) || 0,
      tags: form.tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    };

    const options = { onSuccess: () => navigate('/admin/topics') };
    if (isEditing) {
      updateTopic.mutate({ id: topicId, payload }, options);
    } else {
      createTopic.mutate(payload, options);
    }
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Content administration"
        eyebrowIcon={Tags}
        title={isEditing ? 'Edit topic' : 'Create topic'}
        description={
          isEditing
            ? 'Update the topic metadata used to organise lessons, quiz questions, projects, and interview content.'
            : 'Create a reusable topic for organising lessons, quiz questions, projects, and interview content.'
        }
        actions={
          <Link
            to="/admin/topics"
            className="ui-button ui-button--secondary gap-2"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to topics
          </Link>
        }
      />

      {archived ? (
        <Card className="mx-auto w-full max-w-4xl border-amber-200 bg-amber-50/55 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  This topic is archived
                </h2>
                <StatusPill status="archived" />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Restore the topic from Topic Management before editing it. This keeps archived dependency trees stable and predictable.
              </p>
            </div>
            <Link to="/admin/topics" className="ui-button ui-button--secondary shrink-0">
              Open topic management
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="mx-auto w-full max-w-4xl shadow-sm">
          <div className="border-b border-border pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
              Topic details
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              {isEditing ? 'Update topic information' : 'Add a topic to the content library'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Keep names concise and use tags for alternate keywords. Topic availability is managed separately from this editor.
            </p>
          </div>

          <ErrorMessage message={errorMessage} />

          <form onSubmit={submit} className="mt-5 space-y-5">
            <Input
              label="Title"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Example: JavaScript Closures"
              required
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Category"
                value={form.category}
                onChange={(event) => updateField('category', event.target.value)}
                placeholder="Example: JavaScript"
                required
              />
              <Select
                label="Difficulty"
                value={form.difficulty}
                onChange={(event) => updateField('difficulty', event.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
              <Input
                label="Order"
                type="number"
                min="0"
                value={form.order}
                onChange={(event) => updateField('order', event.target.value)}
              />
              <Input
                label="Tags"
                value={form.tags}
                onChange={(event) => updateField('tags', event.target.value)}
                placeholder="closure, lexical scope, functions"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Link to="/admin/topics" className="ui-button ui-button--secondary">
                Cancel
              </Link>
              <Button
                type="submit"
                className="gap-2"
                isLoading={mutation.isPending}
                loadingLabel={isEditing ? 'Saving...' : 'Creating...'}
              >
                <Save size={16} aria-hidden="true" />
                {isEditing ? 'Save changes' : 'Create topic'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </PageShell>
  );
}
