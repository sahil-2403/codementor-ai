import { PracticeTask } from '../../models/PracticeTask.js';
import { PracticeSubmission } from '../../models/PracticeSubmission.js';
import { Course } from '../../models/Course.js';
import { Lesson } from '../../models/Lesson.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { ensureFound, requireArchivedForDelete, transitionStatus } from './common.js';

const referenceId = (value) => value?._id || value;

const validateLessons = async ({ courseId, lessonIds = [], requirePublished = false }) => {
  const normalizedIds = lessonIds.map(referenceId).filter(Boolean);
  if (!normalizedIds.length) return [];

  const lessons = await Lesson.find({
    _id: { $in: normalizedIds },
    course: referenceId(courseId)
  }).select('_id status title').lean();

  if (lessons.length !== new Set(normalizedIds.map(String)).size) {
    throw new ApiError(400, 'Every related lesson must belong to the selected Course', [], 'CONTENT_REFERENCE_INVALID');
  }

  if (requirePublished) {
    const unavailable = lessons.filter((lesson) => lesson.status !== 'published');
    if (unavailable.length) {
      throw new ApiError(
        400,
        'Publish all related lessons before publishing this practice task',
        unavailable.map((lesson) => ({ field: 'relatedLessons', message: lesson.title })),
        'CONTENT_NOT_READY'
      );
    }
  }

  return lessons;
};

const validatePublish = async (practiceTask) => {
  const courseId = referenceId(practiceTask.course);
  const course = await Course.findById(courseId).select('status title').lean();
  if (!course || course.status === 'archived') {
    throw new ApiError(400, 'Practice task must belong to an available Course', [
      { field: 'course', message: 'Restore the parent Course before publishing this Practice task.' }
    ], 'CONTENT_NOT_READY');
  }

  await validateLessons({ courseId, lessonIds: practiceTask.relatedLessons || [], requirePublished: true });
  if (!practiceTask.requirements?.length) {
    throw new ApiError(400, 'Add at least one practice requirement before publishing', [
      { field: 'requirements', message: 'At least one requirement is required' }
    ], 'CONTENT_NOT_READY');
  }
  if (!String(practiceTask.expectedOutput || '').trim()) {
    throw new ApiError(400, 'Describe the expected output before publishing', [
      { field: 'expectedOutput', message: 'Expected output is required' }
    ], 'CONTENT_NOT_READY');
  }
};

export const listPracticeTasks = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (query.course) filter.course = query.course;
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (search) filter.$or = [{ title: search }, { description: search }, { moduleTitle: search }, { tags: search }];

  return listWithPagination({
    model: PracticeTask,
    filter,
    query,
    populate: [
      { path: 'course', select: 'title slug status' },
      { path: 'relatedLessons', select: 'title slug status difficulty' }
    ]
  });
};

export const getPracticeTask = async (id) => ensureFound(
  await PracticeTask.findById(id)
    .populate('course', 'title slug status technologies availableLevels')
    .populate('relatedLessons', 'title slug status difficulty topic'),
  'Practice task'
);

export const createPracticeTask = async (payload) => {
  const course = ensureFound(await Course.findById(payload.course).select('_id status'), 'Course');
  if (course.status === 'archived') throw new ApiError(409, 'Archived Courses cannot receive practice tasks', [], 'COURSE_ARCHIVED');
  await validateLessons({ courseId: course._id, lessonIds: payload.relatedLessons || [] });

  return PracticeTask.create({
    ...payload,
    slug: generateSlug(payload.title),
    status: 'draft'
  });
};

export const updatePracticeTask = async ({ id, payload }) => {
  const practiceTask = ensureFound(await PracticeTask.findById(id), 'Practice task');
  if (practiceTask.status === 'archived') {
    throw new ApiError(409, 'Archived practice tasks are read-only. Restore the practice task first.', [], 'CONTENT_ARCHIVED');
  }

  await validateLessons({ courseId: practiceTask.course, lessonIds: payload.relatedLessons ?? practiceTask.relatedLessons ?? [] });
  const normalized = { ...payload };
  delete normalized.course;
  delete normalized.status;
  if (normalized.title) normalized.slug = generateSlug(normalized.title);

  Object.assign(practiceTask, normalized);
  if (practiceTask.status === 'published') await validatePublish(practiceTask);
  await practiceTask.save();
  return practiceTask;
};

export const changePracticeTaskStatus = async (args) => {
  const practiceTask = ensureFound(await PracticeTask.findById(args.id).select('course status'), 'Practice task');

  if (args.status === 'draft' && practiceTask.status === 'archived') {
    const course = await Course.findById(practiceTask.course).select('status').lean();
    if (!course || course.status === 'archived') {
      throw new ApiError(409, 'This practice task cannot be restored while its Course is archived.', [
        { field: 'course', message: 'Restore the parent Course first.' }
      ], 'PARENT_ARCHIVED');
    }
  }

  return transitionStatus({
    model: PracticeTask,
    label: 'Practice task',
    validatePublish,
    ...args
  });
};

export const deletePracticeTask = async (id) => {
  const practiceTask = ensureFound(await PracticeTask.findById(id), 'Practice task');
  requireArchivedForDelete(practiceTask, 'Practice task');
  const submissions = await PracticeSubmission.countDocuments({ practiceTask: practiceTask._id });

  if (submissions) {
    throw new ApiError(
      409,
      'This practice task has learner submissions, so it cannot be permanently deleted.',
      [{ field: 'submissions', message: `Keep the practice task archived. ${submissions} learner submission(s) must remain connected to it.` }],
      'CONTENT_HAS_HISTORY'
    );
  }

  await practiceTask.deleteOne();
  return practiceTask;
};
