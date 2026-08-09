import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

export const selectionSchema = z.object({
  body: z.discriminatedUnion('type', [
    z.object({ type: z.literal('course'), courseId: objectIdSchema }),
    z.object({ type: z.literal('learning_path'), learningPathId: objectIdSchema })
  ])
});

export const levelSchema = z.object({
  body: z.object({
    enrollmentId: objectIdSchema.optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced'])
  })
});

export const preferencesSchema = z.object({
  body: z.object({
    enrollmentId: objectIdSchema.optional(),
    dailyStudyTime: z.coerce.number().min(15).max(600),
    targetDurationDays: z.coerce.number().min(7).max(365),
    learningStyle: z.string().trim().min(2).max(80),
    knownBasics: z.array(z.string().trim().max(80)).optional().default([]),
    mainFocus: z.string().trim().min(2).max(120)
  })
});

export const skipAssessmentSchema = z.object({
  body: z.object({ enrollmentId: objectIdSchema.optional() })
});
