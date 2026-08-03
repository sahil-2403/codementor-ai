import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import FormTextarea from '../form/FormTextarea.jsx';
import { templateFormSchema } from '../../validations/admin.schema.js';

const defaultModules = [
  { title: 'Module 1', description: 'Describe the module goal', order: 1, durationDays: 7, lessonSlugs: [], quizTags: [] }
];
const emptyForm = { goalKey: 'junior-mern-stack', level: 'beginner', title: '', description: '', estimatedDurationDays: 90, modulesText: JSON.stringify(defaultModules, null, 2) };
const toForm = (template) => template ? {
  goalKey: template.goalKey || 'junior-mern-stack',
  level: template.level || 'beginner',
  title: template.title || '',
  description: template.description || '',
  estimatedDurationDays: template.estimatedDurationDays || 90,
  modulesText: JSON.stringify(template.modules?.length ? template.modules : defaultModules, null, 2)
} : emptyForm;

export default function TemplateForm({ initialData = null, onSubmit, onCancel, isLoading }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ resolver: zodResolver(templateFormSchema), defaultValues: toForm(initialData) });
  useEffect(() => reset(toForm(initialData)), [initialData, reset]);
  const modulesText = watch('modulesText');
  const moduleCount = useMemo(() => {
    try { return JSON.parse(modulesText || '[]').length; } catch { return 0; }
  }, [modulesText]);
  const submit = (values) => onSubmit({ ...values, estimatedDurationDays: Number(values.estimatedDurationDays) || 90, modules: JSON.parse(values.modulesText) });

  return <form onSubmit={handleSubmit(submit)} className="grid gap-3 rounded-[2rem] bg-white/70 p-5">
    <div className="grid gap-3 md:grid-cols-2"><Input label="Goal key" error={errors.goalKey?.message} {...register('goalKey')} /><Select label="Level" {...register('level')}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></div>
    <Input label="Title" error={errors.title?.message} {...register('title')} />
    <Input label="Description" error={errors.description?.message} {...register('description')} />
    <Input label="Estimated days" type="number" error={errors.estimatedDurationDays?.message} {...register('estimatedDurationDays')} />
    <FormTextarea label={`Modules JSON (${moduleCount} modules)`} rows={12} className="font-mono text-xs" registration={register('modulesText')} error={errors.modulesText?.message} />
    <div className="flex gap-2"><Button disabled={isLoading}>{isLoading ? 'Saving...' : initialData ? 'Update template' : 'Create template'}</Button>{onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel edit</Button>}</div>
  </form>;
}
