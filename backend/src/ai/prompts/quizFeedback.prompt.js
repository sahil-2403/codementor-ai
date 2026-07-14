export const buildQuizFeedbackPrompt = ({ weakTopics, answers }) => ({
  instruction: 'Explain mistakes simply and recommend revision actions.',
  weakTopics,
  answers
});
