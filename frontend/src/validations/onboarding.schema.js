import { z } from 'zod';

export const preferencesFormSchema = z.object({
  dailyStudyTime: z.coerce.number().min(15, 'Minimum 15 minutes').max(600, 'Maximum 600 minutes'),
  targetDurationDays: z.coerce.number().min(7, 'Minimum 7 days').max(365, 'Maximum 365 days'),
  learningStyle: z.string().min(2),
  knownBasics: z.string().max(300).default(''),
  mainFocus: z.string().min(2)
});
