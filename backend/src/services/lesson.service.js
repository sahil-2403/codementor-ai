import { Lesson } from '../models/Lesson.js';

const referenceId = (value) => value?._id || value;

export const getLessonById = async (lessonId) => Lesson.findOne({
  _id: lessonId,
  status: 'published'
})
  .populate('topic', 'title slug category difficulty status')
  .lean();

export const getLessonNavigation = ({ course, lessonId }) => {
  if (!course || !lessonId) return { previousLessonId: null, nextLessonId: null };

  const lessons = [...(course.modules || [])]
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .flatMap((module) => [...(module.lessons || [])]
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0)))
    .filter((item) => item.status !== 'locked' && referenceId(item.lesson))
    .map((item) => referenceId(item.lesson).toString());

  const currentIndex = lessons.findIndex((id) => id === lessonId.toString());
  if (currentIndex < 0) return { previousLessonId: null, nextLessonId: null };

  return {
    previousLessonId: currentIndex > 0 ? lessons[currentIndex - 1] : null,
    nextLessonId: currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  };
};
