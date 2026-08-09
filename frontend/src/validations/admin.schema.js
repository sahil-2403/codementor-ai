import { z } from 'zod';

const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);

export const lessonFormSchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  topic: z.string().trim().min(1, 'Topic is required'),
  difficulty: difficultyEnum,
  theory: z.string().trim().min(10, 'Theory should explain the concept'),
  codeExample: z.string().default(''),
  codeExplanation: z.string().default(''),
  commonMistakes: z.array(z.object({
    value: z.string().trim().min(1, 'Enter the mistake or remove this row')
  })).default([]),
  interviewDefinition: z.string().default(''),
  interviewQuestions: z.array(z.object({
    question: z.string().trim().min(1, 'Question is required'),
    answer: z.string().trim().min(1, 'Expected answer is required')
  })).default([]),
  practiceTask: z.string().default(''),
  tags: z.string().default(''),
  estimatedMinutes: z.coerce.number().min(5).max(300)
});

export const questionFormSchema = z.object({
  question: z.string().trim().min(5, 'Question is required'),
  type: z.enum(['mcq', 'code_output', 'short_answer']),
  topic: z.string().trim().min(1, 'Topic is required'),
  relatedLesson: z.string().default(''),
  difficulty: difficultyEnum,
  codeSnippet: z.string().default(''),
  options: z.array(z.object({
    value: z.string().trim().min(1, 'Enter an option or remove this row')
  })).default([]),
  correctOptionIndex: z.string().default(''),
  correctAnswer: z.string().default(''),
  explanation: z.string().default(''),
  tags: z.string().default('')
}).superRefine((values, context) => {
  if (values.type === 'mcq') {
    if (values.options.length < 2) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Add at least two answer options' });
    }
    const correctIndex = Number(values.correctOptionIndex);
    if (!Number.isInteger(correctIndex) || !values.options[correctIndex]?.value?.trim()) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['correctOptionIndex'], message: 'Choose the correct option' });
    }
  } else if (!values.correctAnswer.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['correctAnswer'], message: 'Correct answer is required' });
  }
});

export const interviewQuestionFormSchema = z.object({
  question: z.string().trim().min(5, 'Question is required'),
  topicRef: z.string().trim().min(1, 'Topic is required'),
  type: z.enum(['definition', 'concept', 'output', 'scenario', 'debugging', 'system_design_lite']),
  difficulty: difficultyEnum,
  expectedAnswer: z.string().trim().min(1, 'Expected answer is required'),
  answerChecklist: z.array(z.object({
    value: z.string().trim().min(1, 'Enter a review point or remove this row')
  })).default([]),
  tags: z.string().default('')
});

const roadmapModuleFormSchema = z.object({
  title: z.string().trim().min(2, 'Module title is required'),
  description: z.string().default(''),
  durationDays: z.coerce.number().int().min(1, 'Use at least 1 day').max(90, 'Keep a module within 90 days'),
  lessonSlugs: z.array(z.string()).default([]),
  quizTags: z.array(z.string()).default([])
});

export const templateFormSchema = z.object({
  goalKey: z.string().trim().min(2, 'Learning path is required'),
  level: difficultyEnum,
  title: z.string().trim().min(2, 'Title is required'),
  description: z.string().default(''),
  modules: z.array(roadmapModuleFormSchema).min(1, 'Add at least one roadmap module')
}).superRefine((values, context) => {
  const totalDays = values.modules.reduce((sum, module) => sum + Number(module.durationDays || 0), 0);
  if (totalDays > 365) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['modules'],
      message: 'The full roadmap must be 365 days or less'
    });
  }
});
