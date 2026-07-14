import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

export const revisionStatusSchema = z.object({
  params: z.object({ revisionId: objectIdSchema }),
  body: z.object({ status: z.enum(['completed', 'skipped']) })
});
