export const chunkLessonContent = (lesson) => {
  const text = [lesson.title, lesson.theory, lesson.codeExplanation, lesson.interviewDefinition, lesson.practiceTask]
    .filter(Boolean)
    .join('\n\n');

  return text.match(/.{1,800}(\s|$)/g)?.map((chunk) => chunk.trim()).filter(Boolean) || [];
};
