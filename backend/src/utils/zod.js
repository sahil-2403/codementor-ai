import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format');
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.string().trim().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.string().trim().max(40).optional(),
  difficulty: z.string().trim().max(40).optional(),
  type: z.string().trim().max(40).optional(),
  topic: z.string().trim().max(120).optional()
});
