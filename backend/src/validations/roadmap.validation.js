import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

export const generateFromAssessmentSchema = z.object({
  body: z.object({
    enrollmentId: objectIdSchema,
    assessmentId: objectIdSchema,
    forceNewVersion: z.boolean().optional().default(false)
  })
});

export const roadmapJobParamSchema = z.object({
  params: z.object({ jobId: objectIdSchema })
});
