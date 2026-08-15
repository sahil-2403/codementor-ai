import mongoose from 'mongoose';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { PracticeTask } from '../../models/PracticeTask.js';
import { PracticeSubmission } from '../../models/PracticeSubmission.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { CoursePlan } from '../../models/CoursePlan.js';
import { Progress } from '../../models/Progress.js';
import { RevisionItem } from '../../models/RevisionItem.js';
import { WeeklyReport } from '../../models/WeeklyReport.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import {
  PUBLISHABLE_STATUS,
  assertCourseExists,
  assertTopicExists,
  cleanInterviewPairs,
  cleanReferenceArray,
  cleanStringArray,
  ensureEditable,
  ensureFound,
  requireArchivedForDelete,
  transitionStatus
} from './common.js';

const ids = (documents = []) => documents.map((item) => item._id);

const assertNotUsedByTemplate = async (lessonId, { publishedOnly = false } = {}) => {
  const filter = { 'modules.lessons': lessonId };
  if (publishedOnly) filter.status = PUBLISHABLE_STATUS.PUBLISHED;
  const template = await RoadmapTemplate.findOne(filter).select('title').lean();
  if (!template) return;

  throw new ApiError(
    409,
    publishedOnly
      ? 'This lesson is used by a published roadmap template.'
      : 'This lesson is still referenced by a roadmap template.',
    [{ field: 'template', message: `Open Roadmap Templates and remove this Lesson from “${template.title}” first.` }],
    'TEMPLATE_DEPENDENCY_EXISTS'
  );
};

const assertLessonPublishable = async (lesson) => {
  const errors = [];
  if (String(lesson.title || '').trim().length < 2) errors.push({ field: 'title', message: 'Title is required' });
  if (String(lesson.theory || '').trim().length < 10) errors.push({ field: 'theory', message: 'Theory must contain at least 10 characters' });
  if (!lesson.topic) errors.push({ field: 'topic', message: 'Topic is required' });
  if (lesson.codeExample && !String(lesson.codeExplanation || '').trim()) errors.push({ field: 'codeExplanation', message: 'Explain the code example before publishing' });
  (lesson.interviewQuestions || []).forEach((item, index) => {
    if (!String(item.question || '').trim() || !String(item.answer || '').trim()) {
      errors.push({ field: `interviewQuestions.${index}`, message: 'Each interview question must include both a question and answer' });
    }
  });
  if (errors.length) throw new ApiError(400, 'Lesson is not ready to publish', errors, 'CONTENT_NOT_READY');
  await assertCourseExists(lesson.course, { requirePublished: true });
  await assertTopicExists({ topicId: lesson.topic, courseId: lesson.course });
};

export const resolveLessonImpact = async (lessonId) => {
  const lesson = ensureFound(
    await Lesson.findById(lessonId)
      .populate('course', 'title slug status')
      .populate('topic', 'title status course'),
    'Lesson'
  );
  const quizDocs = await QuizQuestion.find({ relatedLesson: lesson._id }).select('_id');
  const practiceDocs = await PracticeTask.find({ relatedLessons: lesson._id }).select('_id');
  const quizQuestionIds = ids(quizDocs);
  const practiceTaskIds = ids(practiceDocs);

  const [practiceSubmissions, quizAttempts, affectedCoursePlans, progressRecords, revisionItems, weeklyReports, templates] = await Promise.all([
    practiceTaskIds.length ? PracticeSubmission.countDocuments({ practiceTask: { $in: practiceTaskIds } }) : 0,
    quizQuestionIds.length ? QuizAttempt.countDocuments({ 'answers.question': { $in: quizQuestionIds } }) : 0,
    CoursePlan.countDocuments({ $or: [{ 'modules.lessons.lesson': lesson._id }, ...(quizQuestionIds.length ? [{ 'modules.quizQuestions': { $in: quizQuestionIds } }] : [])] }),
    Progress.countDocuments({ completedLessons: lesson._id }),
    RevisionItem.countDocuments({ relatedLesson: lesson._id }),
    WeeklyReport.countDocuments({ completedLessons: lesson._id }),
    RoadmapTemplate.countDocuments({ 'modules.lessons': lesson._id })
  ]);

  return {
    lesson,
    quizQuestionIds,
    practiceTaskIds,
    counts: {
      quizQuestions: quizQuestionIds.length,
      practiceTasks: practiceTaskIds.length,
      practiceSubmissions,
      quizAttempts,
      affectedCoursePlans,
      progressRecords,
      revisionItems,
      weeklyReports,
      templates
    }
  };
};

export const listLessons = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { theory: search }, { tags: search }];
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.course && mongoose.isValidObjectId(query.course)) filter.course = query.course;
  if (query.topic && mongoose.isValidObjectId(query.topic)) filter.topic = query.topic;

  return listWithPagination({
    model: Lesson,
    filter,
    query,
    populate: [
      { path: 'course', select: 'title slug status' },
      { path: 'topic', select: 'title status course' }
    ]
  });
};

export const getLesson = async (id) => ensureFound(
  await Lesson.findById(id).populate('course', 'title slug status').populate('topic', 'title status course'),
  'Lesson'
);

export const getLessonImpact = async (id) => {
  const impact = await resolveLessonImpact(id);
  return { lesson: impact.lesson, counts: impact.counts };
};

export const createLesson = async (payload) => {
  await assertCourseExists(payload.course);
  await assertTopicExists({ topicId: payload.topic, courseId: payload.course });
  const lesson = await Lesson.create({
    ...payload,
    technologies: cleanReferenceArray(payload.technologies),
    slug: generateSlug(payload.title),
    commonMistakes: cleanStringArray(payload.commonMistakes),
    interviewQuestions: cleanInterviewPairs(payload.interviewQuestions),
    tags: cleanStringArray(payload.tags),
    status: PUBLISHABLE_STATUS.DRAFT
  });
  return lesson.populate([
    { path: 'course', select: 'title slug status' },
    { path: 'topic', select: 'title status course' }
  ]);
};

export const updateLesson = async ({ id, payload }) => {
  const lesson = ensureFound(await Lesson.findById(id), 'Lesson');
  ensureEditable(lesson, 'Lesson');
  if (payload.course && payload.course.toString() !== lesson.course.toString()) {
    throw new ApiError(409, 'Lesson course cannot be changed. Create the lesson under the target course instead.', [], 'CONTENT_COURSE_IMMUTABLE');
  }

  const nextTopic = payload.topic || lesson.topic;
  await assertTopicExists({ topicId: nextTopic, courseId: lesson.course });
  const normalized = {
    ...payload,
    ...(payload.title ? { slug: generateSlug(payload.title) } : {}),
    ...(payload.technologies ? { technologies: cleanReferenceArray(payload.technologies) } : {}),
    ...(payload.commonMistakes ? { commonMistakes: cleanStringArray(payload.commonMistakes) } : {}),
    ...(payload.interviewQuestions ? { interviewQuestions: cleanInterviewPairs(payload.interviewQuestions) } : {}),
    ...(payload.tags ? { tags: cleanStringArray(payload.tags) } : {})
  };
  delete normalized.course;
  delete normalized.status;
  Object.assign(lesson, normalized);
  if (lesson.status === PUBLISHABLE_STATUS.PUBLISHED) await assertLessonPublishable(lesson);
  await lesson.save();
  return lesson.populate([
    { path: 'course', select: 'title slug status' },
    { path: 'topic', select: 'title status course' }
  ]);
};

export const changeLessonStatus = async ({ id, status, confirmPublish = false }) => {
  if (status === PUBLISHABLE_STATUS.PUBLISHED) {
    return transitionStatus({
      model: Lesson,
      id,
      label: 'Lesson',
      status,
      confirmPublish,
      validatePublish: assertLessonPublishable,
      populate: [
        { path: 'course', select: 'title slug status' },
        { path: 'topic', select: 'title status course' }
      ]
    });
  }

  if (!['archived', 'restored'].includes(status)) {
    throw new ApiError(400, 'Invalid lesson status', [], 'VALIDATION_ERROR');
  }

  const impact = await resolveLessonImpact(id);
  const lesson = impact.lesson;

  if (status === 'archived') {
    if (lesson.status === PUBLISHABLE_STATUS.ARCHIVED) return { lesson, counts: impact.counts };
    await assertNotUsedByTemplate(lesson._id, { publishedOnly: true });
    lesson.status = PUBLISHABLE_STATUS.ARCHIVED;
    await lesson.save();
    await Promise.all([
      QuizQuestion.updateMany({ _id: { $in: impact.quizQuestionIds } }, { status: 'archived' }),
      PracticeTask.updateMany({ _id: { $in: impact.practiceTaskIds } }, { status: 'archived' })
    ]);
  } else {
    if (lesson.status !== PUBLISHABLE_STATUS.ARCHIVED) return { lesson, counts: impact.counts };
    if (lesson.course?.status === PUBLISHABLE_STATUS.ARCHIVED) {
      throw new ApiError(409, 'This lesson cannot be restored while its Course is archived.', [
        { field: 'course', message: 'Restore the parent Course first.' }
      ], 'PARENT_ARCHIVED');
    }
    if (lesson.topic?.status === 'archived') {
      throw new ApiError(409, 'This lesson cannot be restored while its Topic is archived.', [
        { field: 'topic', message: 'Restore the parent Topic first.' }
      ], 'PARENT_ARCHIVED');
    }

    lesson.status = PUBLISHABLE_STATUS.DRAFT;
    await lesson.save();
    await Promise.all([
      QuizQuestion.updateMany({ _id: { $in: impact.quizQuestionIds } }, { status: 'draft' }),
      PracticeTask.updateMany({ _id: { $in: impact.practiceTaskIds } }, { status: 'draft' })
    ]);
  }

  return { lesson, counts: impact.counts };
};

export const deleteLesson = async (id) => {
  const impact = await resolveLessonImpact(id);
  const { lesson, quizQuestionIds, practiceTaskIds, counts } = impact;
  requireArchivedForDelete(lesson, 'Lesson');
  await assertNotUsedByTemplate(lesson._id);

  const historicalUsage = counts.practiceSubmissions + counts.quizAttempts + counts.affectedCoursePlans +
    counts.progressRecords + counts.revisionItems + counts.weeklyReports;
  if (historicalUsage > 0) {
    throw new ApiError(
      409,
      'This lesson has learner history, so it cannot be permanently deleted.',
      [{ field: 'learnerHistory', message: 'Keep the Lesson archived so existing learner history remains valid.' }],
      'LEARNER_HISTORY_EXISTS'
    );
  }

  await Promise.all([
    PracticeTask.deleteMany({ _id: { $in: practiceTaskIds } }),
    QuizQuestion.deleteMany({ _id: { $in: quizQuestionIds } })
  ]);
  await Lesson.deleteOne({ _id: lesson._id });
  return { lesson, counts };
};
