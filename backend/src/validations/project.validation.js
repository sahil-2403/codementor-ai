import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

export const submitProjectSchema = z.object({
  body: z.object({
    projectTaskId: objectIdSchema,
    submittedCode: z.string().max(15000).optional().default(''),
    submittedExplanation: z.string().max(5000).optional().default('')
  }).refine((data) => data.submittedCode.trim() || data.submittedExplanation.trim(), {
    message: 'Submit code or explanation for review'
  })
});
