import mongoose from 'mongoose';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { ProjectTask } from '../../models/ProjectTask.js';
import { ProjectSubmission } from '../../models/ProjectSubmission.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { CoursePlan } from '../../models/CoursePlan.js';
import { Progress } from '../../models/Progress.js';
import { RevisionItem } from '../../models/RevisionItem.js';
import { WeeklyReport } from '../../models/WeeklyReport.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
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
const withSession = (query, session) => (session ? query.session(session) : query);
const operationOptions = (session) => (session ? { session } : undefined);

const runLifecycleOperation = async (operation) => {
  if (!env.enableMongoTransactions) return operation(null);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => { result = await operation(session); });
  } finally {
    await session.endSession();
  }
  return result;
};

const assertNotUsedByTemplate = async (lessonId, { publishedOnly = false } = {}) => {
  const filter = { 'modules.lessons': lessonId };
  if (publishedOnly) filter.status = PUBLISHABLE_STATUS.PUBLISHED;
  const template = await RoadmapTemplate.findOne(filter).select('_id title status').lean();
  if (template) {
    throw new ApiError(
      409,
      publishedOnly
        ? 'This lesson is used by a published roadmap template.'
        : 'This lesson is still referenced by a roadmap template.',
      [{ field: 'template', message: `Open Roadmap Templates and archive or update “${template.title}” first. Remove this Lesson from the template before permanently deleting it.` }],
      'TEMPLATE_DEPENDENCY_EXISTS'
    );
  }
};

const archiveDependentContent = async ({ model, contentIds, lessonId, session }) => {
  if (!contentIds.length) return;
  await model.updateMany(
    { _id: { $in: contentIds } },
    [
      {
        $set: {
          archivedByLessons: { $setUnion: [{ $ifNull: ['$archivedByLessons', []] }, [lessonId]] },
          statusBeforeCascadeArchive: {
            $cond: [
              { $in: ['$status', ['draft', 'published']] },
              '$status',
              { $ifNull: ['$statusBeforeCascadeArchive', 'draft'] }
            ]
          },
          status: 'archived'
        }
      }
    ],
    operationOptions(session)
  );
};

const restoreDependentContent = async ({ model, contentIds, session, clearManualArchive = false }) => {
  if (!contentIds.length) return;
  const reset = {
    status: {
      $cond: [
        { $in: ['$statusBeforeCascadeArchive', ['draft', 'published']] },
        '$statusBeforeCascadeArchive',
        'draft'
      ]
    },
    archivedByLessons: [],
    archivedByTopics: [],
    statusBeforeCascadeArchive: null,
    statusBeforeTopicArchive: null
  };
  if (clearManualArchive) {
    reset.manualArchive = false;
    reset.statusBeforeManualArchive = null;
  }
  await model.updateMany({ _id: { $in: contentIds } }, [{ $set: reset }], operationOptions(session));
};

const assertLessonPublishable = async (lesson) => {
  const errors = [];
  if (String(lesson.title || '').trim().length < 2) errors.push({ field: 'title', message: 'Title is required' });
  if (String(lesson.theory || '').trim().length < 10) errors.push({ field: 'theory', message: 'Theory must contain at least 10 characters' });
  if (!lesson.topic) errors.push({ field: 'topic', message: 'Topic is required' });
  if (lesson.codeExample && !String(lesson.codeExplanation || '').trim()) errors.push({ field: 'codeExplanation', message: 'Explain the code example before publishing' });
  (lesson.interviewQuestions || []).forEach((item, index) => {
    if (!String(item.question || '').trim() || !String(item.answer || '').trim()) errors.push({ field: `interviewQuestions.${index}`, message: 'Each interview question must include both a question and answer' });
  });
  if (errors.length) throw new ApiError(400, 'Lesson is not ready to publish', errors, 'CONTENT_NOT_READY');
  await assertCourseExists(lesson.course, { requirePublished: true });
  await assertTopicExists({ topicId: lesson.topic, courseId: lesson.course });
};

export const resolveLessonImpact = async (lessonId, { session = null } = {}) => {
  const lesson = ensureFound(
    await withSession(
      Lesson.findById(lessonId).populate('course', 'title slug status').populate('topic', 'title status course'),
      session
    ),
    'Lesson'
  );
  const quizDocs = await withSession(QuizQuestion.find({ relatedLesson: lesson._id }).select('_id'), session);
  const projectDocs = await withSession(ProjectTask.find({ relatedLessons: lesson._id }).select('_id'), session);
  const quizQuestionIds = ids(quizDocs);
  const projectTaskIds = ids(projectDocs);
  const [projectSubmissions, quizAttempts, affectedCoursePlans, progressRecords, revisionItems, weeklyReports, templates] = await Promise.all([
    projectTaskIds.length ? withSession(ProjectSubmission.countDocuments({ projectTask: { $in: projectTaskIds } }), session) : 0,
    quizQuestionIds.length ? withSession(QuizAttempt.countDocuments({ 'answers.question': { $in: quizQuestionIds } }), session) : 0,
    withSession(CoursePlan.countDocuments({ $or: [{ 'modules.lessons.lesson': lesson._id }, ...(quizQuestionIds.length ? [{ 'modules.quizQuestions': { $in: quizQuestionIds } }] : [])] }), session),
    withSession(Progress.countDocuments({ completedLessons: lesson._id }), session),
    withSession(RevisionItem.countDocuments({ relatedLesson: lesson._id }), session),
    withSession(WeeklyReport.countDocuments({ completedLessons: lesson._id }), session),
    withSession(RoadmapTemplate.countDocuments({ 'modules.lessons': lesson._id }), session)
  ]);
  return {
    lesson,
    quizQuestionIds,
    projectTaskIds,
    counts: { quizQuestions: quizQuestionIds.length, projects: projectTaskIds.length, projectSubmissions, quizAttempts, affectedCoursePlans, progressRecords, revisionItems, weeklyReports, templates }
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
    status: PUBLISHABLE_STATUS.DRAFT,
    manualArchive: false
  });
  await invalidateContentCache();
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
  for (const field of ['status', 'manualArchive', 'archivedByTopics', 'statusBeforeCascadeArchive', 'statusBeforeTopicArchive', 'statusBeforeCourseArchive']) delete normalized[field];
  Object.assign(lesson, normalized);
  if (lesson.status === PUBLISHABLE_STATUS.PUBLISHED) await assertLessonPublishable(lesson);
  await lesson.save();
  await invalidateContentCache();
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
  if (!['archived', 'restored'].includes(status)) throw new ApiError(400, 'Invalid lesson status', [], 'VALIDATION_ERROR');

  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveLessonImpact(id, { session });
    const lesson = impact.lesson;
    const topicBlockers = lesson.archivedByTopics || [];

    if (status === 'archived') {
      if (lesson.status === PUBLISHABLE_STATUS.ARCHIVED) return { lesson, counts: impact.counts };
      await assertNotUsedByTemplate(lesson._id, { publishedOnly: true });
      lesson.statusBeforeCascadeArchive = ['draft', 'published'].includes(lesson.status) ? lesson.status : PUBLISHABLE_STATUS.DRAFT;
      lesson.statusBeforeTopicArchive = null;
      lesson.manualArchive = true;
      lesson.status = PUBLISHABLE_STATUS.ARCHIVED;
      await lesson.save(operationOptions(session));
      await archiveDependentContent({ model: QuizQuestion, contentIds: impact.quizQuestionIds, lessonId: lesson._id, session });
      await archiveDependentContent({ model: ProjectTask, contentIds: impact.projectTaskIds, lessonId: lesson._id, session });
      return { lesson, counts: impact.counts };
    }

    if (lesson.status !== PUBLISHABLE_STATUS.ARCHIVED) return { lesson, counts: impact.counts };
    if (lesson.course?.status === PUBLISHABLE_STATUS.ARCHIVED) {
      throw new ApiError(409, 'This lesson cannot be restored while its Course is archived.', [
        { field: 'course', message: 'Open Courses and restore the parent Course first. Restoring the Course will restore all of its curriculum.' }
      ], 'PARENT_ARCHIVED');
    }
    if (topicBlockers.length || lesson.topic?.status === 'archived') {
      throw new ApiError(409, 'This lesson cannot be restored while its Topic is archived.', [
        { field: 'topic', message: 'Open Topics and restore the parent Topic first. Restoring the Topic will restore all of its child content.' }
      ], 'PARENT_ARCHIVED');
    }

    const previousStatus = lesson.statusBeforeCascadeArchive || lesson.statusBeforeTopicArchive || PUBLISHABLE_STATUS.DRAFT;
    lesson.manualArchive = false;
    lesson.status = ['draft', 'published'].includes(previousStatus) ? previousStatus : PUBLISHABLE_STATUS.DRAFT;
    lesson.statusBeforeCascadeArchive = null;
    lesson.statusBeforeTopicArchive = null;
    lesson.statusBeforeCourseArchive = null;
    lesson.archivedByTopics = [];
    await lesson.save(operationOptions(session));
    await restoreDependentContent({ model: QuizQuestion, contentIds: impact.quizQuestionIds, session, clearManualArchive: true });
    await restoreDependentContent({ model: ProjectTask, contentIds: impact.projectTaskIds, session });
    return { lesson, counts: impact.counts };
  });

  await invalidateContentCache();
  return result;
};

export const deleteLesson = async (id) => {
  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveLessonImpact(id, { session });
    const { lesson, quizQuestionIds, projectTaskIds, counts } = impact;
    requireArchivedForDelete(lesson, 'Lesson');
    await assertNotUsedByTemplate(lesson._id);

    const historicalUsage = counts.projectSubmissions + counts.quizAttempts + counts.affectedCoursePlans + counts.progressRecords + counts.revisionItems + counts.weeklyReports;
    if (historicalUsage > 0) {
      throw new ApiError(
        409,
        'This lesson has learner history, so it cannot be permanently deleted.',
        [{ field: 'learnerHistory', message: 'Keep the Lesson archived. Existing learner progress, attempts, revisions, reports, and roadmaps must remain valid.' }],
        'LEARNER_HISTORY_EXISTS'
      );
    }

    if (projectTaskIds.length) await ProjectTask.deleteMany({ _id: { $in: projectTaskIds } }, operationOptions(session));
    if (quizQuestionIds.length) await QuizQuestion.deleteMany({ _id: { $in: quizQuestionIds } }, operationOptions(session));
    await Lesson.deleteOne({ _id: lesson._id }, operationOptions(session));
    return { lesson, counts };
  });
  await invalidateContentCache();
  return result;
};
