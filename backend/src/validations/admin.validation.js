import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

const objectId = objectIdSchema;
const statusEnum = z.enum(['draft', 'published', 'archived']);
const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);

export const topicSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    category: z.string().min(2),
    difficulty: difficultyEnum.default('beginner'),
    tags: z.array(z.string()).optional().default([]),
    order: z.coerce.number().optional().default(0)
  })
});

export const topicUpdateSchema = z.object({
  body: topicSchema.shape.body.partial()
});

export const lessonSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    topic: objectId,
    difficulty: difficultyEnum.default('beginner'),
    theory: z.string().min(10),
    codeExample: z.string().optional().default(''),
    codeExplanation: z.string().optional().default(''),
    commonMistakes: z.array(z.string()).optional().default([]),
    interviewDefinition: z.string().optional().default(''),
    interviewQuestions: z.array(z.object({ question: z.string(), answer: z.string() })).optional().default([]),
    practiceTask: z.string().optional().default(''),
    tags: z.array(z.string()).optional().default([]),
    estimatedMinutes: z.coerce.number().optional().default(45),
    status: statusEnum.optional().default('published')
  })
});

export const lessonUpdateSchema = z.object({
  body: lessonSchema.shape.body.partial()
});

export const questionSchema = z.object({
  body: z.object({
    question: z.string().min(5),
    type: z.enum(['mcq', 'code_output', 'short_answer']).default('mcq'),
    options: z.array(z.string()).optional().default([]),
    correctAnswer: z.string(),
    explanation: z.string().optional().default(''),
    topic: objectId,
    difficulty: difficultyEnum.default('beginner'),
    relatedLesson: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    status: statusEnum.optional().default('published')
  })
});

export const questionUpdateSchema = z.object({
  body: questionSchema.shape.body.partial()
});

const templateModuleSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default(''),
  order: z.coerce.number().optional().default(0),
  durationDays: z.coerce.number().optional().default(7),
  lessonSlugs: z.array(z.string()).optional().default([]),
  quizTags: z.array(z.string()).optional().default([])
});

export const templateSchema = z.object({
  body: z.object({
    goalKey: z.string().min(2),
    level: difficultyEnum,
    title: z.string().min(2),
    description: z.string().optional().default(''),
    modules: z.array(templateModuleSchema).default([]),
    estimatedDurationDays: z.coerce.number().optional().default(90),
    status: statusEnum.optional().default('published')
  })
});

export const templateUpdateSchema = z.object({
  body: templateSchema.shape.body.partial()
});

export const statusUpdateSchema = z.object({
  body: z.object({ status: statusEnum })
});

export const idParamSchema = z.object({ params: z.object({ id: objectIdSchema }) });
