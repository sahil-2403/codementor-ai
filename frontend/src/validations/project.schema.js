import { z } from 'zod';

export const projectSubmissionSchema = z.object({
  submittedCode: z.string().max(15000, 'Code is too long').default(''),
  submittedExplanation: z.string().max(5000, 'Explanation is too long').default('')
}).refine((data) => data.submittedCode.trim() || data.submittedExplanation.trim(), {
  message: 'Add code or an explanation before submitting',
  path: ['submittedCode']
});
