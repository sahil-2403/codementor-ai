import mongoose from 'mongoose';
import { Lesson } from '../../models/Lesson.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import {
  PUBLISHABLE_STATUS,
  assertTopicExists,
  cleanInterviewPairs,
  cleanStringArray,
  ensureEditable,
  ensureFound,
  transitionStatus
} from './common.js';

const assertLessonPublishable = async (lesson) => {
  const errors = [];
  if (String(lesson.title || '').trim().length < 2) errors.push({ field: 'title', message: 'Title is required' });
  if (String(lesson.theory || '').trim().length < 10) errors.push({ field: 'theory', message: 'Theory must contain at least 10 characters' });
  if (!lesson.topic) errors.push({ field: 'topic', message: 'Topic is required' });
  if (lesson.codeExample && !String(lesson.codeExplanation || '').trim()) {
    errors.push({ field: 'codeExplanation', message: 'Explain the code example before publishing' });
  }
  lesson.interviewQuestions.forEach((item, index) => {
    if (!String(item.question || '').trim() || !String(item.answer || '').trim()) {
      errors.push({ field: `interviewQuestions.${index}`, message: 'Each interview question must include both a question and answer' });
    }
  });
  if (errors.length) throw new ApiError(400, 'Lesson is not ready to publish', errors, 'CONTENT_NOT_READY');
  await assertTopicExists(lesson.topic);
};

export const listLessons = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { theory: search }, { tags: search }];
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.topic && mongoose.isValidObjectId(query.topic)) filter.topic = query.topic;
  return listWithPagination({ model: Lesson, filter, query, populate: ['topic'] });
};

export const getLesson = async (id) => ensureFound(await Lesson.findById(id).populate('topic', 'title'), 'Lesson');

export const createLesson = async (payload) => {
  await assertTopicExists(payload.topic);
  const lesson = await Lesson.create({
    ...payload,
    slug: generateSlug(payload.title),
    commonMistakes: cleanStringArray(payload.commonMistakes),
    interviewQuestions: cleanInterviewPairs(payload.interviewQuestions),
    tags: cleanStringArray(payload.tags),
    status: PUBLISHABLE_STATUS.DRAFT
  });
  await invalidateContentCache();
  return lesson.populate('topic', 'title');
};

export const updateLesson = async ({ id, payload }) => {
  const lesson = ensureFound(await Lesson.findById(id), 'Lesson');
  ensureEditable(lesson, 'Lesson');
  if (payload.topic) await assertTopicExists(payload.topic);
  const normalized = {
    ...payload,
    ...(payload.title ? { slug: generateSlug(payload.title) } : {}),
    ...(payload.commonMistakes ? { commonMistakes: cleanStringArray(payload.commonMistakes) } : {}),
    ...(payload.interviewQuestions ? { interviewQuestions: cleanInterviewPairs(payload.interviewQuestions) } : {}),
    ...(payload.tags ? { tags: cleanStringArray(payload.tags) } : {})
  };
  delete normalized.status;
  Object.assign(lesson, normalized);
  await lesson.save();
  await invalidateContentCache();
  return lesson.populate('topic', 'title');
};

export const changeLessonStatus = (args) => transitionStatus({
  model: Lesson,
  label: 'Lesson',
  validatePublish: assertLessonPublishable,
  populate: ['topic'],
  ...args
});
