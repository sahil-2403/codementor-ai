import { Lesson } from '../models/Lesson.js';

export const getLessonById = async (lessonId) => Lesson.findOne({
  _id: lessonId,
  status: 'published'
})
  .populate('topic', 'title slug category difficulty status')
  .lean();
