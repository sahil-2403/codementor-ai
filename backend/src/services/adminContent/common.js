import { Topic } from '../../models/Topic.js';
import { Lesson } from '../../models/Lesson.js';
import { ApiError } from '../../utils/ApiError.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';

export const PUBLISHABLE_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
});

const allowedStatusTransitions = Object.freeze({
  [PUBLISHABLE_STATUS.DRAFT]: new Set([PUBLISHABLE_STATUS.PUBLISHED, PUBLISHABLE_STATUS.ARCHIVED]),
  [PUBLISHABLE_STATUS.PUBLISHED]: new Set([PUBLISHABLE_STATUS.ARCHIVED]),
  [PUBLISHABLE_STATUS.ARCHIVED]: new Set()
});

export const ensureFound = (document, label) => {
  if (!document) throw new ApiError(404, `${label} not found`, [], 'RESOURCE_NOT_FOUND');
  return document;
};

export const ensureEditable = (document, label) => {
  if (document.status === PUBLISHABLE_STATUS.ARCHIVED) {
    throw new ApiError(409, `${label} is archived and cannot be edited`, [], 'CONTENT_ARCHIVED');
  }
};

export const cleanStringArray = (values = []) => Array.from(new Set(
  values.map((value) => String(value).trim()).filter(Boolean)
));

export const cleanInterviewPairs = (values = []) => values
  .map((item) => ({
    question: String(item?.question || '').trim(),
    answer: String(item?.answer || '').trim()
  }))
  .filter((item) => item.question || item.answer);

export const cleanTemplateModules = (modules = []) => modules.map((module, index) => ({
  title: String(module.title || '').trim(),
  description: String(module.description || '').trim(),
  order: Number(module.order) || index + 1,
  durationDays: Number(module.durationDays) || 7,
  lessonSlugs: cleanStringArray(module.lessonSlugs),
  quizTags: cleanStringArray(module.quizTags)
}));

export const assertTopicExists = async (topicId) => {
  const topic = await Topic.findById(topicId).select('_id title').lean();
  if (!topic) {
    throw new ApiError(400, 'Selected topic does not exist', [
      { field: 'topic', message: 'Choose an existing topic' }
    ], 'CONTENT_REFERENCE_INVALID');
  }
  return topic;
};

export const assertRelatedLesson = async ({ lessonId, topicId, requirePublished = false }) => {
  if (!lessonId) return null;
  const lesson = await Lesson.findById(lessonId).select('_id title topic status').lean();
  if (!lesson) {
    throw new ApiError(400, 'Selected related lesson does not exist', [
      { field: 'relatedLesson', message: 'Choose an existing lesson' }
    ], 'CONTENT_REFERENCE_INVALID');
  }
  if (topicId && lesson.topic.toString() !== topicId.toString()) {
    throw new ApiError(400, 'Related lesson must belong to the selected topic', [
      { field: 'relatedLesson', message: 'Lesson topic does not match the question topic' }
    ], 'CONTENT_REFERENCE_INVALID');
  }
  if (requirePublished && lesson.status !== PUBLISHABLE_STATUS.PUBLISHED) {
    throw new ApiError(400, 'Related lesson must be published first', [
      { field: 'relatedLesson', message: 'Publish the related lesson before publishing this question' }
    ], 'CONTENT_NOT_READY');
  }
  return lesson;
};

export const transitionStatus = async ({ model, id, label, status, confirmPublish, validatePublish, populate = [] }) => {
  const document = ensureFound(await model.findById(id), label);
  if (document.status === status) return document;
  if (!allowedStatusTransitions[document.status]?.has(status)) {
    throw new ApiError(409, `Cannot move ${label.toLowerCase()} from ${document.status} to ${status}`, [], 'INVALID_STATUS_TRANSITION');
  }
  if (status === PUBLISHABLE_STATUS.PUBLISHED) {
    if (confirmPublish !== true) {
      throw new ApiError(400, 'Publishing requires explicit confirmation', [
        { field: 'confirmPublish', message: 'Confirm that the content has been reviewed' }
      ], 'PUBLISH_CONFIRMATION_REQUIRED');
    }
    await validatePublish(document);
  }
  document.status = status;
  await document.save();
  for (const path of populate) await document.populate(path);
  await invalidateContentCache();
  return document;
};
