import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from '../utils/zod.js';

export const lessonIdParamSchema = z.object({ params: z.object({ lessonId: objectIdSchema }) });
export const moduleIdParamSchema = z.object({ params: z.object({ moduleId: objectIdSchema }) });
export const attemptIdParamSchema = z.object({ params: z.object({ attemptId: objectIdSchema }) });
export const taskIdParamSchema = z.object({ params: z.object({ taskId: objectIdSchema }) });
export const submissionIdParamSchema = z.object({ params: z.object({ submissionId: objectIdSchema }) });
export const questionIdParamSchema = z.object({ params: z.object({ questionId: objectIdSchema }) });
export const assessmentIdReportSchema = z.object({ params: z.object({ assessmentId: objectIdSchema }) });
export const enrollmentIdParamSchema = z.object({ params: z.object({ enrollmentId: objectIdSchema }) });
export const listQuerySchema = z.object({ query: paginationQuerySchema.optional().default({}) });
