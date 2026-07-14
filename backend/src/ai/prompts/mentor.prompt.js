export const buildMentorPrompt = ({ userQuestion, currentLesson, weakTopics, userLevel }) => ({
  instruction: 'Answer like a patient MERN mentor. Stay within the current lesson context.',
  userLevel,
  currentLesson,
  weakTopics,
  userQuestion
});
