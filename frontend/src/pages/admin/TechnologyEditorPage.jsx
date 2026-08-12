import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Boxes } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import FormInput from '../../components/form/FormInput.jsx';
import FormTextarea from '../../components/form/FormTextarea.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import { TECHNOLOGY_TYPES } from '../../constants/catalog.js';
import { adminApi } from '../../api/adminApi.js';
import { technologyFormSchema } from '../../validations/admin.schema.js';

const defaults = { name: '', type: 'language', description: '', parentTechnology: '', iconKey: '', order: 0 };

export default function TechnologyEditorPage() {
  const { technologyId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(technologyId);
  const [technology, setTechnology] = useState(null);
  const [technologies, setTechnologies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(technologyFormSchema), defaultValues: defaults });

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    const requests = [adminApi.listTechnologies({ limit: 100 })];
    if (editing) requests.push(adminApi.getTechnology(technologyId));

    Promise.all(requests)
      .then(([listResult, itemResult]) => {
        if (!active) return;
        setTechnologies(listResult?.technologies || []);
        if (editing) setTechnology(itemResult?.technology || null);
      })
      .catch((requestError) => {
        if (active) setLoadError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [editing, technologyId]);

  useEffect(() => {
    if (!technology) return;
    reset({
      name: technology.name || '',
      type: technology.type || 'language',
      description: technology.description || '',
      parentTechnology: technology.parentTechnology?._id || '',
      iconKey: technology.iconKey || '',
      order: technology.order || 0
    });
  }, [technology, reset]);

  if (isLoading) return <Loader label="Loading technology editor..." />;
  if (editing && loadError) return <EmptyState title="Technology is unavailable" description={loadError.message} actionLabel="Back to technologies" onAction={() => navigate('/admin/technologies')} />;

  const submit = async (values) => {
    const payload = { ...values, parentTechnology: values.parentTechnology || null, order: Number(values.order) || 0 };
    setIsSaving(true);
    setSaveError(null);
    try {
      if (editing) await adminApi.updateTechnology(technologyId, payload);
      else await adminApi.createTechnology(payload);
      navigate('/admin/technologies');
    } catch (requestError) {
      setSaveError(requestError);
    } finally {
      setIsSaving(false);
    }
  };

  const parents = technologies.filter((item) => item._id !== technologyId && item.status !== 'archived');

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Learning catalog" eyebrowIcon={Boxes} title={editing ? 'Edit technology' : 'Create technology'} description="Technologies classify courses and support learner discovery. They do not control which course a learner is allowed to start." actions={<Link to="/admin/technologies" className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={(saveError || (!editing && loadError))?.message} />
    <form onSubmit={handleSubmit(submit)} className="mx-auto w-full max-w-3xl space-y-5">
      <Card className="space-y-4 shadow-sm"><div className="grid gap-4 md:grid-cols-2"><FormInput label="Name" registration={register('name')} error={errors.name?.message} placeholder="Example: React" /><Select label="Type" {...register('type')} error={errors.type?.message}>{TECHNOLOGY_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div><FormTextarea label="Description" rows={4} registration={register('description')} error={errors.description?.message} placeholder="Describe how this technology is used in the catalog..." /><div className="grid gap-4 md:grid-cols-2"><Select label="Parent technology (optional)" {...register('parentTechnology')} error={errors.parentTechnology?.message}><option value="">No parent</option>{parents.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select><FormInput label="Display order" type="number" min="0" registration={register('order')} error={errors.order?.message} /></div><FormInput label="Icon key (optional)" registration={register('iconKey')} error={errors.iconKey?.message} placeholder="react" /></Card>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate('/admin/technologies')}>Cancel</Button><Button type="submit" isLoading={isSaving} loadingLabel="Saving...">{editing ? 'Save changes' : 'Create draft'}</Button></div>
    </form>
  </PageShell>;
}
