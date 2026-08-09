import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const projectTaskSchema = z.object({
  course: objectId,
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(10).max(4000),
  moduleTitle: z.string().trim().max(180).optional().default(''),
  topicOrder: z.coerce.number().int().min(0).optional().default(0),
  solution: z.string().optional().default(''),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  relatedLessons: z.array(objectId).optional().default([]),
  requirements: z.array(z.string().trim().min(1)).optional().default([]),
  starterHints: z.array(z.string().trim().min(1)).optional().default([]),
  expectedOutput: z.string().optional().default(''),
  evaluationChecklist: z.array(z.string().trim().min(1)).optional().default([]),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  estimatedMinutes: z.coerce.number().int().min(15).max(1440).optional().default(90)
});

export const projectTaskUpdateSchema = projectTaskSchema.partial().omit({ course: true });

export const projectTaskStatusSchema = z.object({
  status: z.enum(['published', 'archived']),
  confirmPublish: z.boolean().optional().default(false)
});
