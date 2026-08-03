import { Topic } from '../../models/Topic.js';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import { ensureFound } from './common.js';

export const listTopics = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { category: search }, { tags: search }];
  if (query.difficulty) filter.difficulty = query.difficulty;
  return listWithPagination({ model: Topic, filter, query: { sortBy: 'order', sortOrder: 'asc', ...query } });
};

export const createTopic = async (payload) => {
  const topic = await Topic.create({ ...payload, slug: generateSlug(payload.title) });
  await invalidateContentCache();
  return topic;
};

export const updateTopic = async ({ id, payload }) => {
  const topic = ensureFound(await Topic.findById(id), 'Topic');
  Object.assign(topic, payload);
  if (payload.title) topic.slug = generateSlug(payload.title);
  await topic.save();
  await invalidateContentCache();
  return topic;
};

export const deleteTopic = async (id) => {
  const [lessonCount, questionCount] = await Promise.all([
    Lesson.countDocuments({ topic: id }),
    QuizQuestion.countDocuments({ topic: id })
  ]);
  if (lessonCount || questionCount) {
    throw new ApiError(409, 'Topic is still referenced by content', [
      { field: 'lessons', message: `${lessonCount} lesson(s) reference this topic` },
      { field: 'questions', message: `${questionCount} question(s) reference this topic` }
    ], 'TOPIC_IN_USE');
  }
  const topic = ensureFound(await Topic.findByIdAndDelete(id), 'Topic');
  await invalidateContentCache();
  return topic;
};
