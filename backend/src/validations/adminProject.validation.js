import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

const cleanString = z.string().trim();
const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);

const projectTaskBody = z.object({
  course: objectIdSchema,
  title: cleanString.min(2).max(180),
  description: cleanString.min(10).max(4000),
  moduleTitle: cleanString.max(180).optional().default(''),
  topicOrder: z.coerce.number().int().min(0).optional().default(0),
  solution: z.string().optional().default(''),
  difficulty: difficultyEnum.default('beginner'),
  relatedLessons: z.array(objectIdSchema).optional().default([]),
  requirements: z.array(cleanString.min(1)).optional().default([]),
  starterHints: z.array(cleanString.min(1)).optional().default([]),
  expectedOutput: z.string().optional().default(''),
  evaluationChecklist: z.array(cleanString.min(1)).optional().default([]),
  tags: z.array(cleanString.min(1)).optional().default([]),
  estimatedMinutes: z.coerce.number().int().min(15).max(1440).optional().default(90)
});

export const projectTaskSchema = z.object({ body: projectTaskBody });

export const projectTaskUpdateSchema = z.object({
  body: projectTaskBody.partial().refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
});

export const projectTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['draft', 'published', 'archived']),
    confirmPublish: z.boolean().optional().default(false)
  }).superRefine((body, context) => {
    if (body.status === 'published' && body.confirmPublish !== true) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPublish'],
        message: 'Confirm that the project task has been reviewed before publishing'
      });
    }
  })
});
