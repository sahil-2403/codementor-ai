export const mentorFallback = ({ lesson, relatedContext = [], weakTopics = [] }) => ({
  answer: '',
  sources: relatedContext.map((item) => item.source).filter(Boolean),
  summary: 'Gemini is temporarily unavailable. Use the saved lesson explanations and related learning resources instead.',
  suggestedActions: [
    lesson?.title ? `Review ${lesson.title}.` : 'Review the related lesson.',
    weakTopics.length ? `Revise: ${weakTopics.slice(0, 3).map((item) => item.topic).join(', ')}.` : 'Write a small example from the lesson without copying.',
    'Try the mentor again later.'
  ],
  provider: 'fallback',
  model: 'saved-learning-guidance',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCost: 0,
  aiAvailable: false
});

export const quizExplanationFallback = ({ attempt, relatedContext = [] }) => ({
  feedback: attempt?.feedback || 'Gemini explanation is unavailable. Review each stored answer explanation and revisit the related lesson.',
  focusTopics: attempt?.weakTopicsDetected?.map((item) => item.topic) || [],
  sources: relatedContext.map((item) => item.source).filter(Boolean),
  provider: 'fallback',
  model: 'saved-course-explanation',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCost: 0,
  aiAvailable: false
});

export const projectReviewFallback = ({ task }) => ({
  score: null,
  summary: 'Gemini review is unavailable. Your submission was saved. Review it manually against the project requirements.',
  strengths: [],
  improvements: [
    'Check every project requirement against your code or pseudocode.',
    'Explain your approach, validation, edge cases, and tradeoffs.',
    'Retry Gemini review later without creating another project attempt.'
  ],
  checklist: (task?.evaluationChecklist || []).map((item) => ({
    item,
    passed: false,
    feedback: 'Not evaluated. Review this item manually.'
  })),
  weakTopicsDetected: [],
  provider: 'fallback',
  model: 'manual-project-checklist',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCost: 0,
  aiAvailable: false
});

export const interviewFeedbackFallback = ({ question }) => ({
  score: null,
  summary: 'Gemini feedback is unavailable. Your answer was saved. Compare it with the expected answer and checklist.',
  expectedAnswer: question?.expectedAnswer || '',
  strengths: [],
  improvements: [
    'Structure the answer as definition, reason, example, and tradeoff.',
    'Compare your response with the expected answer and checklist.',
    'Retry Gemini feedback later without using another interview attempt.'
  ],
  weakTopicsDetected: [],
  provider: 'fallback',
  model: 'saved-interview-guidance',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCost: 0,
  aiAvailable: false
});
