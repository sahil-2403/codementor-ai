import mongoose from 'mongoose';
import { Topic } from '../../models/Topic.js';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { ProjectTask } from '../../models/ProjectTask.js';
import { InterviewQuestion } from '../../models/InterviewQuestion.js';
import { ProjectSubmission } from '../../models/ProjectSubmission.js';
import { InterviewAttempt } from '../../models/InterviewAttempt.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { CoursePlan } from '../../models/CoursePlan.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import { assertCourseExists, cleanReferenceArray, cleanStringArray, ensureFound, requireArchivedForDelete } from './common.js';

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

const archiveByTopic = async ({ model, ids: contentIds, topicId, session }) => {
  if (!contentIds.length) return;
  await model.updateMany(
    { _id: { $in: contentIds } },
    [
      {
        $set: {
          archivedByTopics: { $setUnion: [{ $ifNull: ['$archivedByTopics', []] }, [topicId]] },
          statusBeforeTopicArchive: {
            $cond: [
              { $in: ['$status', ['draft', 'published']] },
              '$status',
              { $ifNull: ['$statusBeforeTopicArchive', 'draft'] }
            ]
          },
          status: 'archived'
        }
      }
    ],
    operationOptions(session)
  );
};

const restoreByTopic = async ({ model, ids: contentIds, topicId, session, clearLessonBlockers = false, clearManualArchive = false }) => {
  if (!contentIds.length) return;
  const reset = {
    archivedByTopics: { $setDifference: [{ $ifNull: ['$archivedByTopics', []] }, [topicId]] },
    status: {
      $cond: [
        { $in: ['$statusBeforeTopicArchive', ['draft', 'published']] },
        '$statusBeforeTopicArchive',
        'draft'
      ]
    },
    statusBeforeTopicArchive: null,
    statusBeforeCascadeArchive: null
  };
  if (clearLessonBlockers) reset.archivedByLessons = [];
  if (clearManualArchive) {
    reset.manualArchive = false;
    reset.statusBeforeManualArchive = null;
  }
  await model.updateMany({ _id: { $in: contentIds } }, [{ $set: reset }], operationOptions(session));
};

export const resolveTopicImpact = async (topicId, { session = null } = {}) => {
  const topic = ensureFound(
    await withSession(Topic.findById(topicId).populate('course', 'title slug status'), session),
    'Topic'
  );
  const lessonDocs = await withSession(Lesson.find({ topic: topic._id }).select('_id'), session);
  const quizDocs = await withSession(QuizQuestion.find({ topic: topic._id }).select('_id'), session);
  const lessonIds = ids(lessonDocs);
  const quizQuestionIds = ids(quizDocs);
  const projectDocs = lessonIds.length
    ? await withSession(ProjectTask.find({ course: topic.course?._id || topic.course, relatedLessons: { $in: lessonIds } }).select('_id'), session)
    : [];
  const interviewDocs = await withSession(
    InterviewQuestion.find({ course: topic.course?._id || topic.course, topicRef: topic._id }).select('_id'),
    session
  );
  const projectTaskIds = ids(projectDocs);
  const interviewQuestionIds = ids(interviewDocs);
  const [projectSubmissions, interviewAttempts, quizAttempts, affectedCoursePlans, templates] = await Promise.all([
    projectTaskIds.length ? withSession(ProjectSubmission.countDocuments({ projectTask: { $in: projectTaskIds } }), session) : 0,
    interviewQuestionIds.length ? withSession(InterviewAttempt.countDocuments({ question: { $in: interviewQuestionIds } }), session) : 0,
    quizQuestionIds.length ? withSession(QuizAttempt.countDocuments({ 'answers.question': { $in: quizQuestionIds } }), session) : 0,
    lessonIds.length || quizQuestionIds.length
      ? withSession(CoursePlan.countDocuments({
        $or: [
          ...(lessonIds.length ? [{ 'modules.lessons.lesson': { $in: lessonIds } }] : []),
          ...(quizQuestionIds.length ? [{ 'modules.quizQuestions': { $in: quizQuestionIds } }] : [])
        ]
      }), session)
      : 0,
    lessonIds.length ? withSession(RoadmapTemplate.countDocuments({ 'modules.lessons': { $in: lessonIds } }), session) : 0
  ]);
  return {
    topic,
    lessonIds,
    quizQuestionIds,
    projectTaskIds,
    interviewQuestionIds,
    counts: {
      lessons: lessonIds.length,
      quizQuestions: quizQuestionIds.length,
      projects: projectTaskIds.length,
      interviewQuestions: interviewQuestionIds.length,
      projectSubmissions,
      interviewAttempts,
      quizAttempts,
      affectedCoursePlans,
      templates
    }
  };
};

export const listTopics = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { category: search }, { tags: search }];
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.course && mongoose.isValidObjectId(query.course)) filter.course = query.course;
  return listWithPagination({
    model: Topic,
    filter,
    query: { sortBy: 'order', sortOrder: 'asc', ...query },
    populate: [{ path: 'course', select: 'title slug status' }]
  });
};

export const getTopic = async (id) => ensureFound(await Topic.findById(id).populate('course', 'title slug status'), 'Topic');

export const getTopicImpact = async (id) => {
  const impact = await resolveTopicImpact(id);
  return { topic: impact.topic, counts: impact.counts };
};

export const createTopic = async (payload) => {
  await assertCourseExists(payload.course);
  const topic = await Topic.create({
    ...payload,
    technologies: cleanReferenceArray(payload.technologies),
    tags: cleanStringArray(payload.tags),
    slug: generateSlug(payload.title),
    status: 'active'
  });
  await invalidateContentCache();
  return topic.populate('course', 'title slug status');
};

export const updateTopic = async ({ id, payload }) => {
  const topic = ensureFound(await Topic.findById(id), 'Topic');
  if (topic.status === 'archived') throw new ApiError(409, 'Archived topics must be restored before editing', [], 'TOPIC_ARCHIVED');
  if (payload.course && payload.course.toString() !== topic.course.toString()) {
    throw new ApiError(409, 'Topic course cannot be changed. Create the topic under the target course instead.', [], 'CONTENT_COURSE_IMMUTABLE');
  }
  const previousTitle = topic.title;
  const normalized = {
    ...payload,
    ...(payload.technologies ? { technologies: cleanReferenceArray(payload.technologies) } : {}),
    ...(payload.tags ? { tags: cleanStringArray(payload.tags) } : {})
  };
  delete normalized.course;
  delete normalized.status;
  Object.assign(topic, normalized);
  if (payload.title) topic.slug = generateSlug(payload.title);
  await topic.save();

  if (payload.title && previousTitle !== topic.title) {
    await InterviewQuestion.updateMany(
      { course: topic.course, topicRef: topic._id },
      { $set: { topic: topic.title } }
    );
  }
  await invalidateContentCache();
  return topic.populate('course', 'title slug status');
};

export const changeTopicStatus = async ({ id, status }) => {
  if (!['active', 'archived'].includes(status)) throw new ApiError(400, 'Invalid topic status', [], 'VALIDATION_ERROR');
  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveTopicImpact(id, { session });
    const topic = impact.topic;
    if (topic.status === status) return { topic, counts: impact.counts };

    if (status === 'archived') {
      const publishedTemplate = impact.lessonIds.length
        ? await withSession(RoadmapTemplate.findOne({ status: 'published', 'modules.lessons': { $in: impact.lessonIds } }).select('title'), session)
        : null;
      if (publishedTemplate) {
        throw new ApiError(
          409,
          'This topic contains lessons used by a published roadmap template.',
          [{ field: 'template', message: `Open Roadmap Templates and archive or update “${publishedTemplate.title}” first, then archive this Topic again.` }],
          'TEMPLATE_DEPENDENCY_EXISTS'
        );
      }
      topic.status = 'archived';
      await topic.save(operationOptions(session));
      await archiveByTopic({ model: Lesson, ids: impact.lessonIds, topicId: topic._id, session });
      await archiveByTopic({ model: QuizQuestion, ids: impact.quizQuestionIds, topicId: topic._id, session });
      await archiveByTopic({ model: ProjectTask, ids: impact.projectTaskIds, topicId: topic._id, session });
      await archiveByTopic({ model: InterviewQuestion, ids: impact.interviewQuestionIds, topicId: topic._id, session });
    } else {
      if (topic.course?.status === 'archived') {
        throw new ApiError(
          409,
          'This topic cannot be restored while its Course is archived.',
          [{ field: 'course', message: 'Open Courses and restore the parent Course first. Restoring the Course will restore all of its curriculum.' }],
          'PARENT_ARCHIVED'
        );
      }
      topic.status = 'active';
      await topic.save(operationOptions(session));
      await restoreByTopic({ model: Lesson, ids: impact.lessonIds, topicId: topic._id, session, clearManualArchive: true });
      await restoreByTopic({ model: QuizQuestion, ids: impact.quizQuestionIds, topicId: topic._id, session, clearLessonBlockers: true, clearManualArchive: true });
      await restoreByTopic({ model: ProjectTask, ids: impact.projectTaskIds, topicId: topic._id, session, clearLessonBlockers: true });
      await restoreByTopic({ model: InterviewQuestion, ids: impact.interviewQuestionIds, topicId: topic._id, session, clearManualArchive: true });
    }
    return { topic, counts: impact.counts };
  });
  await invalidateContentCache();
  return result;
};

export const deleteTopic = async (id) => {
  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveTopicImpact(id, { session });
    const { topic, lessonIds, quizQuestionIds, projectTaskIds, interviewQuestionIds, counts } = impact;
    requireArchivedForDelete(topic, 'Topic');
    if (counts.templates) {
      throw new ApiError(
        409,
        'This topic still contains lessons referenced by roadmap templates.',
        [{ field: 'templates', message: 'Open Roadmap Templates and remove these lessons from every template first. Then return here and delete the archived Topic.' }],
        'TEMPLATE_DEPENDENCY_EXISTS'
      );
    }
    const history = counts.projectSubmissions + counts.interviewAttempts + counts.quizAttempts + counts.affectedCoursePlans;
    if (history > 0) {
      throw new ApiError(
        409,
        'This topic has learner history, so it cannot be permanently deleted.',
        [{ field: 'learnerHistory', message: 'Keep the Topic archived. Existing learner attempts and generated roadmaps must remain valid.' }],
        'LEARNER_HISTORY_EXISTS'
      );
    }

    if (projectTaskIds.length) await ProjectTask.deleteMany({ _id: { $in: projectTaskIds } }, operationOptions(session));
    if (interviewQuestionIds.length) await InterviewQuestion.deleteMany({ _id: { $in: interviewQuestionIds } }, operationOptions(session));
    if (quizQuestionIds.length) await QuizQuestion.deleteMany({ _id: { $in: quizQuestionIds } }, operationOptions(session));
    if (lessonIds.length) await Lesson.deleteMany({ _id: { $in: lessonIds } }, operationOptions(session));
    await Topic.deleteOne({ _id: topic._id }, operationOptions(session));
    return { topic, counts };
  });
  await invalidateContentCache();
  return result;
};
