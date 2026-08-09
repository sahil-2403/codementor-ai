import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpenText,
  Braces,
  ListChecks,
  MessageSquareQuote,
  Plus,
  Trash2
} from 'lucide-react';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import FormTextarea from '../form/FormTextarea.jsx';
import { lessonFormSchema } from '../../validations/admin.schema.js';

const emptyForm = {
  title: '',
  topic: '',
  difficulty: 'beginner',
  theory: '',
  codeExample: '',
  codeExplanation: '',
  commonMistakes: [],
  interviewDefinition: '',
  interviewQuestions: [],
  practiceTask: '',
  tags: '',
  estimatedMinutes: 45
};

const toForm = (lesson, topics) => lesson ? {
  title: lesson.title || '',
  topic: lesson.topic?._id || lesson.topic || topics[0]?._id || '',
  difficulty: lesson.difficulty || 'beginner',
  theory: lesson.theory || '',
  codeExample: lesson.codeExample || '',
  codeExplanation: lesson.codeExplanation || '',
  commonMistakes: (lesson.commonMistakes || []).map((value) => ({ value })),
  interviewDefinition: lesson.interviewDefinition || '',
  interviewQuestions: (lesson.interviewQuestions || []).map((item) => ({
    question: item.question || '',
    answer: item.answer || ''
  })),
  practiceTask: lesson.practiceTask || '',
  tags: (lesson.tags || []).join(', '),
  estimatedMinutes: lesson.estimatedMinutes || 45
} : { ...emptyForm, topic: topics[0]?._id || '' };

function FormSectionHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-4">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong"
        aria-hidden="true"
      >
        <Icon size={18} />
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function LessonForm({
  topics = [],
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
    formState: { errors }
  } = useForm({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: toForm(initialData, topics)
  });

  const mistakes = useFieldArray({ control, name: 'commonMistakes' });
  const interviewQuestions = useFieldArray({ control, name: 'interviewQuestions' });

  useEffect(() => {
    reset(toForm(initialData, topics));
  }, [initialData, topics, reset]);

  const submit = (values) => onSubmit({
    ...values,
    estimatedMinutes: Number(values.estimatedMinutes) || 45,
    tags: values.tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    commonMistakes: values.commonMistakes
      .map((item) => item.value.trim())
      .filter(Boolean),
    interviewQuestions: values.interviewQuestions
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim()
      }))
      .filter((item) => item.question || item.answer)
  });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <Card className="shadow-sm">
        <FormSectionHeader
          icon={BookOpenText}
          eyebrow="Lesson basics"
          title="Core lesson information"
          description="Choose where this lesson belongs and how much time learners should expect to spend on it."
        />

        <div className="mt-5 space-y-4">
          <Input
            label="Title"
            placeholder="Example: Understanding JavaScript Closures"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Topic" error={errors.topic?.message} {...register('topic')}>
              {topics.map((topic) => (
                <option key={topic._id} value={topic._id}>{topic.title}</option>
              ))}
            </Select>

            <Select label="Difficulty" {...register('difficulty')}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>

            <Input
              label="Estimated minutes"
              type="number"
              min="5"
              max="300"
              error={errors.estimatedMinutes?.message}
              {...register('estimatedMinutes')}
            />
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <FormSectionHeader
          icon={Braces}
          eyebrow="Learning content"
          title="Teach the concept clearly"
          description="Write the main explanation first, then support it with code, reasoning, and common mistakes."
        />

        <div className="mt-5 space-y-5">
          <FormTextarea
            label="Theory"
            rows={7}
            placeholder="Explain the concept in clear learner-friendly language..."
            registration={register('theory')}
            error={errors.theory?.message}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <FormTextarea
              label="Code example"
              rows={10}
              placeholder="const example = () => { ... }"
              className="font-mono text-[13px] leading-6"
              registration={register('codeExample')}
              error={errors.codeExample?.message}
            />
            <FormTextarea
              label="Code explanation"
              rows={10}
              placeholder="Explain what the code is doing and why each important part matters..."
              registration={register('codeExplanation')}
              error={errors.codeExplanation?.message}
            />
          </div>

          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="ui-field-label">Common mistakes</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Add each mistake separately so it can be presented cleanly on the learner page.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="min-h-9 gap-2 self-start px-3 text-xs sm:self-auto"
                onClick={() => mistakes.append({ value: '' })}
              >
                <Plus size={14} aria-hidden="true" />
                Add mistake
              </Button>
            </div>

            {mistakes.fields.length ? (
              <div className="mt-3 space-y-2">
                {mistakes.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-2 rounded-surface border border-border bg-surface-secondary/35 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Input
                        label={`Mistake ${index + 1}`}
                        placeholder="Example: Confusing lexical scope with execution order"
                        error={errors.commonMistakes?.[index]?.value?.message}
                        {...register(`commonMistakes.${index}.value`)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-6 min-h-9 w-9 shrink-0 px-0 text-muted-foreground"
                      onClick={() => mistakes.remove(index)}
                      aria-label={`Remove mistake ${index + 1}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-surface border border-dashed border-border bg-surface-secondary/35 p-4 text-sm text-muted-foreground">
                No common mistakes added yet. This section is optional for a draft.
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <FormSectionHeader
          icon={MessageSquareQuote}
          eyebrow="Interview preparation"
          title="Turn the lesson into interview-ready knowledge"
          description="Give learners a concise definition and optional question-and-answer pairs they can revise later."
        />

        <div className="mt-5 space-y-5">
          <FormTextarea
            label="Interview-ready definition"
            rows={3}
            placeholder="A concise definition a learner could use in an interview..."
            registration={register('interviewDefinition')}
            error={errors.interviewDefinition?.message}
          />

          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="ui-field-label">Interview questions</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Add a question and its expected answer as a pair. No special formatting syntax is required.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="min-h-9 gap-2 self-start px-3 text-xs sm:self-auto"
                onClick={() => interviewQuestions.append({ question: '', answer: '' })}
              >
                <Plus size={14} aria-hidden="true" />
                Add question
              </Button>
            </div>

            {interviewQuestions.fields.length ? (
              <div className="mt-3 space-y-3">
                {interviewQuestions.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-panel border border-border bg-surface-secondary/35 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-foreground">Question {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-8 gap-1.5 px-2 text-xs text-muted-foreground"
                        onClick={() => interviewQuestions.remove(index)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Remove
                      </Button>
                    </div>

                    <div className="mt-3 space-y-3">
                      <Input
                        label="Question"
                        placeholder="Example: What is a closure in JavaScript?"
                        error={errors.interviewQuestions?.[index]?.question?.message}
                        {...register(`interviewQuestions.${index}.question`)}
                      />
                      <FormTextarea
                        label="Expected answer"
                        rows={3}
                        placeholder="Write the answer a learner should be able to explain..."
                        registration={register(`interviewQuestions.${index}.answer`)}
                        error={errors.interviewQuestions?.[index]?.answer?.message}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-surface border border-dashed border-border bg-surface-secondary/35 p-4 text-sm text-muted-foreground">
                No interview questions added yet. Add them when this lesson has interview-relevant concepts.
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <FormSectionHeader
          icon={ListChecks}
          eyebrow="Practice & discovery"
          title="Give learners a next step"
          description="Add a practical exercise and search tags that make this lesson easier to reuse across the platform."
        />

        <div className="mt-5 space-y-4">
          <FormTextarea
            label="Practice task"
            rows={5}
            placeholder="Describe a small task learners can complete after reading the lesson..."
            registration={register('practiceTask')}
            error={errors.practiceTask?.message}
          />

          <div>
            <Input
              label="Tags"
              placeholder="closure, lexical scope, functions"
              error={errors.tags?.message}
              {...register('tags')}
            />
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              Separate search keywords with commas.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 rounded-panel border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          isLoading={isLoading}
          loadingLabel="Saving..."
        >
          {initialData ? 'Save lesson changes' : 'Create lesson draft'}
        </Button>
      </div>
    </form>
  );
}
