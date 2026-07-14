import { Lesson } from '../models/Lesson.js';
import { getCache, setCache } from './cache.service.js';

export const getLessonById = async (lessonId) => {
  const cacheKey = `lesson:${lessonId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  const lesson = await Lesson.findById(lessonId).populate('topic', 'title slug category difficulty').lean();
  if (lesson) await setCache(cacheKey, lesson, 10 * 60);
  return lesson;
};
