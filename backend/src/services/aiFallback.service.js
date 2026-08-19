export const mentorFallback = ({ relatedContext = [] }) => ({
  message: 'Gemini is temporarily unavailable. Use the saved lesson explanations and related learning resources instead.',
  sources: relatedContext.map((item) => item.source).filter(Boolean)
});

export const quizExplanationFallback = ({ attempt, relatedContext = [] }) => ({
  feedback: attempt?.feedback || 'Gemini explanation is unavailable. Review each stored answer explanation and revisit the related lesson.',
  focusTopics: attempt?.weakTopicsDetected?.map((item) => item.topic) || [],
  sources: relatedContext.map((item) => item.source).filter(Boolean),
  aiAvailable: false
});

export const practiceReviewFallback = ({ task }) => ({
  summary: 'Gemini review is unavailable. Your submission was saved. Review it manually against the practice task requirements.',
  strengths: [],
  improvements: [
    'Check every practice task requirement against your code or pseudocode.',
    'Explain your approach, validation, edge cases, and tradeoffs.',
    'Retry Gemini review later without creating another practice attempt.'
  ],
  checklist: (task?.evaluationChecklist || []).map((item) => ({
    item,
    passed: false,
    feedback: 'Not evaluated. Review this item manually.'
  }))
});

export const interviewFeedbackFallback = () => ({
  summary: 'Gemini feedback is unavailable. Your answer was saved. Compare it with the expected answer and checklist.',
  strengths: [],
  improvements: [
    'Structure the answer as definition, reason, example, and tradeoff.',
    'Compare your response with the expected answer and checklist.',
    'Retry Gemini feedback later without using another interview attempt.'
  ]
});
