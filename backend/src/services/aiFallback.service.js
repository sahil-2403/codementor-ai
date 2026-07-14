export const mentorFallback = ({ message, lesson, relatedContext = [], weakTopics = [] }) => {
  const sources = relatedContext.map((item) => item.source).filter(Boolean);
  const sourceText = sources.length
    ? `\n\nRelated lessons to revise:\n${sources.map((source, index) => `${index + 1}. ${source.title}`).join('\n')}`
    : '';
  const weakText = weakTopics.length
    ? `\n\nYour current weak areas: ${weakTopics.slice(0, 3).map((item) => item.topic).join(', ')}.`
    : '';

  return {
    answer: `AI is temporarily unavailable, but here is a safe fallback. Re-read ${lesson?.title || 'the related lesson'}, focus on the exact problem in your question: "${message}", write a small example, and compare it with the lesson code.${weakText}${sourceText}`,
    sources,
    provider: 'fallback',
    model: 'fallback-mentor',
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0
  };
};

export const quizExplanationFallback = ({ attempt, relatedContext = [] }) => ({
  feedback: attempt?.feedback || 'AI explanation is temporarily unavailable. Review each wrong answer, read the stored explanation, and retry a smaller quiz from the same topic.',
  focusTopics: attempt?.weakTopicsDetected?.map((item) => item.topic) || [],
  sources: relatedContext.map((item) => item.source).filter(Boolean),
  provider: 'fallback',
  model: 'fallback-quiz-explainer',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCost: 0
});

export const projectReviewFallback = ({ task, submission }) => {
  const checklist = task?.evaluationChecklist || [];
  const submittedCode = submission?.submittedCode || '';
  const submittedExplanation = submission?.submittedExplanation || '';
  const score = Math.min(75, 40 + (submittedCode.trim() ? 20 : 0) + (submittedExplanation.trim() ? 15 : 0));
  return {
    score,
    summary: 'AI review is temporarily unavailable, so this fallback review used the project checklist and submission completeness.',
    strengths: submittedCode.trim() ? ['You included implementation details.'] : ['You created a submission that can be improved.'],
    improvements: ['Check every requirement in the task checklist.', 'Add edge cases and explain your decisions.', 'Connect your solution to a real MERN project use case.'],
    checklist: checklist.map((item) => ({ item, passed: false, feedback: 'Review manually against this checklist item.' })),
    weakTopicsDetected: [{ topic: task?.moduleTitle || 'Project implementation', score: 60 }],
    provider: 'fallback',
    model: 'fallback-project-review',
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0
  };
};

export const interviewFeedbackFallback = ({ question }) => ({
  score: 60,
  summary: 'AI feedback is temporarily unavailable. Compare your answer with the expected answer and improve structure.',
  expectedAnswer: question?.expectedAnswer || '',
  strengths: ['You attempted the interview answer.'],
  improvements: ['Use this structure: definition → example → MERN project use case → common mistake.', 'Keep it concise and interview-ready.'],
  weakTopicsDetected: [{ topic: question?.topic || 'Interview communication', score: 55 }],
  provider: 'fallback',
  model: 'fallback-interview-feedback',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCost: 0
});
