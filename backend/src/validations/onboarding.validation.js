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

export const skipAssessmentSchema = z.object({
  body: z.object({ enrollmentId: objectIdSchema.optional() })
});
