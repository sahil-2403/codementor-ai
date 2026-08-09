import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

const objectId = objectIdSchema;
const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);
const lifecycleStatusEnum = z.enum(['published', 'archived']);
const lessonLifecycleStatusEnum = z.enum(['published', 'archived', 'restored']);
const questionLifecycleStatusEnum = z.enum(['published', 'archived', 'restored']);
const topicLifecycleStatusEnum = z.enum(['active', 'archived']);
const questionBankEnum = z.enum(['quiz', 'skill_check']);
const cleanString = z.string().trim();
const contentStatusEnum = z.enum(['draft', 'published', 'archived']);
const technologyTypeEnum = z.enum(['language', 'framework', 'runtime', 'database', 'library', 'platform', 'tool']);
const courseCategoryEnum = z.enum(['fundamentals', 'frontend', 'backend', 'fullstack', 'database', 'mobile', 'devops', 'data-ai', 'interview', 'other']);

const courseContextFields = {
  course: objectId,
  technologies: z.array(objectId).optional().default([])
};

export const technologySchema = z.object({
  body: z.object({
    name: cleanString.min(2).max(100),
    type: technologyTypeEnum,
    description: cleanString.max(1000).optional().default(''),
    parentTechnology: objectId.optional().nullable(),
    iconKey: cleanString.max(80).optional().default(''),
    order: z.coerce.number().int().min(0).optional().default(0)
  })
});

export const technologyUpdateSchema = z.object({
  body: technologySchema.shape.body.partial().refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
});

export const courseSchema = z.object({
  body: z.object({
    title: cleanString.min(2).max(160),
    description: cleanString.max(2000).optional().default(''),
    category: courseCategoryEnum,
    technologies: z.array(objectId).min(1),
    primaryTechnology: objectId.optional().nullable(),
    availableLevels: z.array(difficultyEnum).min(1).default(['beginner', 'intermediate', 'advanced']),
    recommendedPrerequisites: z.array(objectId).optional().default([]),
    featured: z.boolean().optional().default(false),
    order: z.coerce.number().int().min(0).optional().default(0)
  })
});

export const courseUpdateSchema = z.object({
  body: courseSchema.shape.body.partial().refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
});

const learningPathCourseSchema = z.object({
  course: objectId,
  order: z.coerce.number().int().min(1),
  defaultLevel: difficultyEnum.optional().nullable(),
  required: z.boolean().optional().default(true)
});

export const learningPathSchema = z.object({
  body: z.object({
    title: cleanString.min(2).max(160),
    description: cleanString.max(2000).optional().default(''),
    category: courseCategoryEnum,
    technologies: z.array(objectId).optional().default([]),
    availableLevels: z.array(difficultyEnum).min(1).default(['beginner', 'intermediate', 'advanced']),
    courses: z.array(learningPathCourseSchema).min(1),
    featured: z.boolean().optional().default(false),
    order: z.coerce.number().int().min(0).optional().default(0)
  })
});

export const learningPathUpdateSchema = z.object({
  body: learningPathSchema.shape.body.partial().refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
});

export const catalogStatusUpdateSchema = z.object({
  body: z.object({ status: contentStatusEnum, confirmPublish: z.boolean().optional().default(false) })
});

export const topicSchema = z.object({
  body: z.object({
    ...courseContextFields,
    title: cleanString.min(2),
    category: cleanString.min(2),
    difficulty: difficultyEnum.default('beginner'),
    tags: z.array(cleanString.min(1)).optional().default([]),
    order: z.coerce.number().int().min(0).optional().default(0)
  })
});

export const topicUpdateSchema = z.object({
  body: topicSchema.shape.body.partial().refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
});

export const topicStatusUpdateSchema = z.object({ body: z.object({ status: topicLifecycleStatusEnum }) });

const interviewPairSchema = z.object({ question: cleanString.min(1), answer: cleanString.min(1) });

export const lessonSchema = z.object({
  body: z.object({
    ...courseContextFields,
    title: cleanString.min(2),
    topic: objectId,
    difficulty: difficultyEnum.default('beginner'),
    theory: cleanString.min(10),
    codeExample: z.string().optional().default(''),
    codeExplanation: z.string().optional().default(''),
    commonMistakes: z.array(cleanString.min(1)).optional().default([]),
    interviewDefinition: z.string().optional().default(''),
    interviewQuestions: z.array(interviewPairSchema).optional().default([]),
    practiceTask: z.string().optional().default(''),
    tags: z.array(cleanString.min(1)).optional().default([]),
    estimatedMinutes: z.coerce.number().int().min(5).max(300).optional().default(45)
  })
});

export const lessonUpdateSchema = z.object({
  body: lessonSchema.shape.body.partial().refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
});

export const lessonStatusUpdateSchema = z.object({
  body: z.object({
    status: lessonLifecycleStatusEnum,
    confirmPublish: z.boolean().optional().default(false)
  }).superRefine((body, context) => {
    if (body.status === 'published' && body.confirmPublish !== true) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPublish'], message: 'Confirm that the lesson has been reviewed before publishing' });
    }
  })
});

export const questionSchema = z.object({
  body: z.object({
    ...courseContextFields,
    question: cleanString.min(5),
    bank: questionBankEnum.optional().default('quiz'),
    type: z.enum(['mcq', 'code_output', 'short_answer']).default('mcq'),
    codeSnippet: z.string().optional().default(''),
    options: z.array(cleanString.min(1)).optional().default([]),
    correctAnswer: cleanString.min(1),
    explanation: z.string().optional().default(''),
    topic: objectId,
    difficulty: difficultyEnum.default('beginner'),
    relatedLesson: objectId.optional().nullable(),
    tags: z.array(cleanString.min(1)).optional().default([])
  })
});

export const questionUpdateSchema = z.object({
  body: questionSchema.shape.body.partial().refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
});

export const questionStatusUpdateSchema = z.object({
  body: z.object({
    status: questionLifecycleStatusEnum,
    confirmPublish: z.boolean().optional().default(false)
  }).superRefine((body, context) => {
    if (body.status === 'published' && body.confirmPublish !== true) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPublish'], message: 'Confirm that the question has been reviewed before publishing' });
    }
  })
});

export const interviewQuestionSchema = z.object({
  body: z.object({
    ...courseContextFields,
    question: cleanString.min(5),
    topic: cleanString.optional().default(''),
    topicRef: objectId.optional().nullable(),
    type: z.enum(['definition', 'concept', 'output', 'scenario', 'debugging', 'system_design_lite']).default('concept'),
    difficulty: difficultyEnum.default('beginner'),
    expectedAnswer: cleanString.min(1),
    answerChecklist: z.array(cleanString.min(1)).optional().default([]),
    tags: z.array(cleanString.min(1)).optional().default([])
  })
});

export const interviewQuestionUpdateSchema = z.object({
  body: interviewQuestionSchema.shape.body.partial().refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
});

const templateModuleSchema = z.object({
  title: cleanString.min(2),
  description: z.string().optional().default(''),
  order: z.coerce.number().int().min(1),
  durationDays: z.coerce.number().int().min(1).max(90).optional().default(7),
  lessons: z.array(objectId).optional().default([]),
  quizTags: z.array(cleanString.min(1)).optional().default([])
});

export const templateSchema = z.object({
  body: z.object({
    course: objectId,
    level: difficultyEnum,
    title: cleanString.min(2),
    description: z.string().optional().default(''),
    modules: z.array(templateModuleSchema).default([]),
    estimatedDurationDays: z.coerce.number().int().min(1).max(365).optional().default(90)
  })
});

export const templateUpdateSchema = z.object({
  body: templateSchema.shape.body.partial().refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
});

export const statusUpdateSchema = z.object({
  body: z.object({
    status: lifecycleStatusEnum,
    confirmPublish: z.boolean().optional().default(false)
  }).superRefine((body, context) => {
    if (body.status === 'published' && body.confirmPublish !== true) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPublish'], message: 'Confirm that the content has been reviewed before publishing' });
    }
  })
});

export const idParamSchema = z.object({ params: z.object({ id: objectIdSchema }) });
