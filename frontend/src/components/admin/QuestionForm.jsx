import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Braces,
  CircleHelp,
  ListChecks,
  Plus,
  Settings2,
  Trash2
} from 'lucide-react';
import FormSectionHeader from './FormSectionHeader.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Textarea from '../common/Textarea.jsx';
import { questionFormSchema } from '../../validations/admin.schema.js';

const defaultOptions = [{ value: 'Option A' }, { value: 'Option B' }];

const emptyForm = (bank) => ({
  question: '',
  type: 'mcq',
  topic: '',
  relatedLesson: '',
  difficulty: bank === 'skill_check' ? 'intermediate' : 'beginner',
  codeSnippet: '',
  options: defaultOptions,
  correctOptionIndex: '',
  correctAnswer: '',
  explanation: '',
  tags: ''
});

const toForm = (question, topics, bank) => {
  if (!question) return { ...emptyForm(bank), topic: topics[0]?._id || '' };

  const options = (question.options || []).length
    ? question.options.map((value) => ({ value }))
    : defaultOptions;
  const correctIndex = options.findIndex((item) => item.value === question.correctAnswer);

  return {
    question: question.question || '',
    type: question.type || 'mcq',
    topic: question.topic?._id || question.topic || topics[0]?._id || '',
    relatedLesson: question.relatedLesson?._id || question.relatedLesson || '',
    difficulty: question.difficulty || (bank === 'skill_check' ? 'intermediate' : 'beginner'),
    codeSnippet: question.codeSnippet || '',
    options,
    correctOptionIndex: correctIndex >= 0 ? String(correctIndex) : '',
    correctAnswer: question.type === 'mcq' ? '' : question.correctAnswer || '',
    explanation: question.explanation || '',
    tags: (question.tags || []).join(', ')
  };
};

export default function QuestionForm({
  bank = 'quiz',
  topics = [],
  lessons = [],
  initialData = null,
  onSubmit,
  onCancel,
  isLoading = false
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(questionFormSchema),
    defaultValues: toForm(initialData, topics, bank)
  });

  const optionFields = useFieldArray({ control, name: 'options' });
  const type = useWatch({ control, name: 'type' });
  const selectedTopic = useWatch({ control, name: 'topic' });
  const relatedLesson = useWatch({ control, name: 'relatedLesson' });
  const correctOptionIndex = useWatch({ control, name: 'correctOptionIndex' });

  useEffect(() => {
    reset(toForm(initialData, topics, bank));
  }, [initialData, topics, bank, reset]);

  const availableLessons = lessons.filter((lesson) => {
    const lessonTopicId = lesson.topic?._id || lesson.topic;
    return lesson.status !== 'archived' && lessonTopicId?.toString() === selectedTopic?.toString();
  });

  useEffect(() => {
    if (bank !== 'quiz' || !relatedLesson) return;
    const stillAvailable = availableLessons.some((lesson) => lesson._id === relatedLesson);
    if (!stillAvailable) setValue('relatedLesson', '');
  }, [availableLessons, bank, relatedLesson, setValue]);

  const removeOption = (index) => {
    const selectedIndex = Number(correctOptionIndex);
    optionFields.remove(index);

    if (!Number.isInteger(selectedIndex)) return;
    if (selectedIndex === index) {
      setValue('correctOptionIndex', '', { shouldValidate: true });
    } else if (selectedIndex > index) {
      setValue('correctOptionIndex', String(selectedIndex - 1), { shouldValidate: true });
    }
  };

  const submit = (values) => {
    const options = values.options.map((item) => item.value.trim()).filter(Boolean);
    const correctIndex = Number(values.correctOptionIndex);
    const correctAnswer = values.type === 'mcq'
      ? options[correctIndex] || ''
      : values.correctAnswer.trim();

    onSubmit({
      question: values.question,
      bank,
      type: values.type,
      codeSnippet: values.codeSnippet,
      topic: values.topic,
      relatedLesson: bank === 'quiz' ? values.relatedLesson || null : null,
      difficulty: values.difficulty,
      options: values.type === 'mcq' ? options : [],
      correctAnswer,
      explanation: values.explanation,
      tags: values.tags.split(',').map((item) => item.trim()).filter(Boolean)
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <Card className="shadow-sm">
        <FormSectionHeader
          icon={CircleHelp}
          eyebrow={bank === 'skill_check' ? 'Skill-check basics' : 'Quiz basics'}
          title="Question context"
          description={bank === 'skill_check'
            ? 'Diagnostic questions measure topic knowledge before roadmap personalization.'
            : 'Quiz questions should reinforce a specific published lesson in the learner roadmap.'}
        />

        <div className="mt-5 space-y-4">
          <Textarea
            label="Question prompt"
            rows={3}
            error={errors.question?.message}
            placeholder="Write the learner-facing question clearly."
            {...register('question')}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Topic" error={errors.topic?.message} {...register('topic')}>
              {topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}
            </Select>
            <Select label="Question type" error={errors.type?.message} {...register('type')}>
              <option value="mcq">Multiple choice</option>
              <option value="code_output">Code output</option>
              <option value="short_answer">Short answer (draft only)</option>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {bank === 'quiz' ? (
              <Select label="Related lesson" error={errors.relatedLesson?.message} {...register('relatedLesson')}>
                <option value="">Choose before publishing</option>
                {availableLessons.map((lesson) => (
                  <option key={lesson._id} value={lesson._id}>{lesson.title} · {lesson.status}</option>
                ))}
              </Select>
            ) : (
              <div className="rounded-surface border border-primary/15 bg-primary-soft/45 p-4">
                <p className="text-sm font-semibold text-foreground">No lesson dependency</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Skill checks run before the roadmap, so they are linked to a Topic rather than a Lesson.</p>
              </div>
            )}

            <Select label="Difficulty" error={errors.difficulty?.message} {...register('difficulty')}>
              {bank === 'quiz' ? <option value="beginner">Beginner</option> : null}
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <FormSectionHeader
          icon={type === 'code_output' ? Braces : ListChecks}
          eyebrow="Answer setup"
          title={type === 'mcq' ? 'Answer options' : type === 'code_output' ? 'Code and expected output' : 'Expected answer'}
          description={type === 'mcq'
            ? 'Add the options and select the correct one directly.'
            : type === 'code_output'
              ? 'Keep the prompt concise and put executable-looking code in the dedicated code surface.'
              : 'Short-answer questions can be saved as drafts but are not publishable yet.'}
        />

        <div className="mt-5 space-y-4">
          {type === 'mcq' ? (
            <fieldset className="space-y-3">
              <legend className="ui-field-label">Answer options</legend>
              {optionFields.fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-3 rounded-surface border border-border bg-surface-secondary/35 p-3">
                  <input
                    type="radio"
                    value={String(index)}
                    className="mt-3 h-4 w-4 accent-primary"
                    aria-label={`Mark option ${index + 1} as correct`}
                    {...register('correctOptionIndex')}
                  />
                  <div className="min-w-0 flex-1">
                    <Input
                      label={`Option ${index + 1}`}
                      error={errors.options?.[index]?.value?.message}
                      {...register(`options.${index}.value`)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-6 min-h-9 w-9 p-0 text-muted-foreground"
                    onClick={() => removeOption(index)}
                    disabled={optionFields.fields.length <= 2}
                    aria-label={`Remove option ${index + 1}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </Button>
                </div>
              ))}
              {errors.correctOptionIndex?.message ? <p className="ui-field-error">{errors.correctOptionIndex.message}</p> : null}
              {typeof errors.options?.message === 'string' ? <p className="ui-field-error">{errors.options.message}</p> : null}
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => optionFields.append({ value: '' })}
                disabled={optionFields.fields.length >= 6}
              >
                <Plus size={15} aria-hidden="true" /> Add option
              </Button>
            </fieldset>
          ) : (
            <>
              {type === 'code_output' ? (
                <Textarea
                  label="Code snippet"
                  rows={7}
                  error={errors.codeSnippet?.message}
                  className="font-mono text-sm leading-6"
                  placeholder="const value = 2;\nconsole.log(value * 3);"
                  {...register('codeSnippet')}
                />
              ) : (
                <div className="rounded-surface border border-amber-200 bg-amber-50/65 p-4">
                  <p className="text-sm font-bold text-amber-800">Draft-only question type</p>
                  <p className="mt-1 text-xs leading-5 text-amber-700">Automatic short-answer grading is not supported yet, so this question cannot be published.</p>
                </div>
              )}
              <Input
                label={type === 'code_output' ? 'Expected output' : 'Expected answer'}
                error={errors.correctAnswer?.message}
                {...register('correctAnswer')}
              />
            </>
          )}
        </div>
      </Card>

      <Card className="shadow-sm">
        <FormSectionHeader
          icon={Settings2}
          eyebrow="Learning feedback"
          title="Explanation and discovery"
          description="Explain why the answer is correct and add useful search or roadmap tags."
        />
        <div className="mt-5 space-y-4">
          <Textarea
            label="Answer explanation"
            rows={4}
            error={errors.explanation?.message}
            placeholder="Explain the reasoning learners should understand after answering."
            {...register('explanation')}
          />
          <Input
            label="Tags"
            error={errors.tags?.message}
            placeholder="closures, lexical-scope, functions"
            {...register('tags')}
          />
          <p className="text-xs leading-5 text-muted-foreground">Use commas to separate search keywords and roadmap matching tags.</p>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel ? <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>Cancel</Button> : null}
        <Button type="submit" isLoading={isLoading} loadingLabel="Saving question...">
          {initialData ? 'Save changes' : bank === 'skill_check' ? 'Create skill-check draft' : 'Create quiz-question draft'}
        </Button>
      </div>
    </form>
  );
}
