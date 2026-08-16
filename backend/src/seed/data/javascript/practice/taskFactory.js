export const task = ({
  topicKey,
  title,
  difficulty,
  relatedLessonKeys,
  description,
  requirements,
  starterHints,
  expectedOutput,
  solution,
  evaluationChecklist,
  tags = [],
  estimatedMinutes = 30
}) => ({
  topicKey,
  title,
  difficulty,
  relatedLessonKeys,
  description,
  requirements,
  starterHints,
  expectedOutput,
  solution,
  evaluationChecklist,
  tags,
  estimatedMinutes
});
