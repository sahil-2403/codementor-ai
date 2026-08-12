import { Technology } from '../../models/Technology.js';
import { Course } from '../../models/Course.js';
import { LearningPath } from '../../models/LearningPath.js';
import { Topic } from '../../models/Topic.js';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { InterviewQuestion } from '../../models/InterviewQuestion.js';
import { ProjectTask } from '../../models/ProjectTask.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { CoursePlan } from '../../models/CoursePlan.js';
import { Enrollment } from '../../models/Enrollment.js';
import { ApiError } from '../../utils/ApiError.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import { PUBLISHABLE_STATUS, ensureFound, requireArchivedForDelete } from './common.js';
import {
  updateTechnology,
  changeTechnologyStatus,
  changeCourseStatus,
  deleteTechnology,
  deleteCourse,
  deleteLearningPath
} from './catalog.service.js';
import { changeTemplateStatus, deleteTemplate } from './template.service.js';

const activeCatalogFilter = { $ne: PUBLISHABLE_STATUS.ARCHIVED };
const dependencyError = (message, details = []) => new ApiError(409, message, details, 'CONTENT_DEPENDENCY_EXISTS');
const instruction = (field, message) => ({ field, message });

const assertTechnologyParentValid = async ({ id, parentTechnology }) => {
  if (!parentTechnology) return;
  if (String(id) === String(parentTechnology)) {
    throw new ApiError(400, 'A technology cannot be its own parent.', [
      instruction('parentTechnology', 'Choose a different parent technology.')
    ], 'CONTENT_REFERENCE_INVALID');
  }

  const parent = await Technology.findOne({
    _id: parentTechnology,
    status: activeCatalogFilter
  }).select('_id').lean();
  if (!parent) {
    throw new ApiError(400, 'Selected parent technology is unavailable.', [
      instruction('parentTechnology', 'Choose an active or draft technology as the parent.')
    ], 'CONTENT_REFERENCE_INVALID');
  }
};

const assertTechnologyArchiveSafe = async (technologyId) => {
  const [courses, paths, children] = await Promise.all([
    Course.countDocuments({ status: activeCatalogFilter, $or: [{ technologies: technologyId }, { primaryTechnology: technologyId }] }),
    LearningPath.countDocuments({ status: activeCatalogFilter, technologies: technologyId }),
    Technology.countDocuments({ status: activeCatalogFilter, parentTechnology: technologyId })
  ]);

  if (courses || paths || children) {
    throw dependencyError('This technology is still used by active catalog items, so it cannot be archived yet.', [
      ...(courses ? [instruction('courses', `${courses} active course(s) use it. Open Courses and remove or replace this technology first.`)] : []),
      ...(paths ? [instruction('learningPaths', `${paths} active learning path(s) use it. Open Learning Paths and remove this technology first.`)] : []),
      ...(children ? [instruction('childTechnologies', `${children} child technology item(s) use it as their parent. Reassign their parent first.`)] : [])
    ]);
  }
};

const assertCourseArchiveSafe = async (courseId) => {
  const [paths, prerequisiteUsers] = await Promise.all([
    LearningPath.countDocuments({ status: activeCatalogFilter, 'courses.course': courseId }),
    Course.countDocuments({ status: activeCatalogFilter, recommendedPrerequisites: courseId })
  ]);

  if (paths || prerequisiteUsers) {
    throw dependencyError('This course is still used by active catalog items, so it cannot be archived yet.', [
      ...(paths ? [instruction('learningPaths', `${paths} active learning path(s) include this course. Open Learning Paths and remove the course first.`)] : []),
      ...(prerequisiteUsers ? [instruction('recommendedPrerequisites', `${prerequisiteUsers} active course(s) recommend this course as a prerequisite. Remove the prerequisite first.`)] : [])
    ]);
  }
};

const assertTemplateCanLeavePublishedCoverage = async (templateId) => {
  const template = ensureFound(
    await RoadmapTemplate.findById(templateId).select('course level title status').lean(),
    'Roadmap template'
  );
  const course = await Course.findById(template.course).select('title status availableLevels').lean();
  const requiredByPublishedCourse = course?.status === PUBLISHABLE_STATUS.PUBLISHED &&
    (course.availableLevels || []).includes(template.level);

  if (requiredByPublishedCourse) {
    throw dependencyError(`This template is required by the published course “${course.title}”.`, [
      instruction('course', 'Archive the Course instead. Course archiving automatically archives its curriculum and templates.')
    ]);
  }
};

const archiveCourseOwnedContent = async (courseId) => {
  await Promise.all([
    Topic.updateMany({ course: courseId }, { status: 'archived' }),
    Lesson.updateMany({ course: courseId }, { status: 'archived' }),
    QuizQuestion.updateMany({ course: courseId }, { status: 'archived' }),
    InterviewQuestion.updateMany({ course: courseId }, { status: 'archived' }),
    ProjectTask.updateMany({ course: courseId }, { status: 'archived' }),
    RoadmapTemplate.updateMany({ course: courseId }, { status: 'archived' })
  ]);
};

const restoreCourseOwnedContent = async (courseId) => {
  await Promise.all([
    Topic.updateMany({ course: courseId }, { status: 'active' }),
    Lesson.updateMany({ course: courseId }, { status: 'draft' }),
    QuizQuestion.updateMany({ course: courseId }, { status: 'draft' }),
    InterviewQuestion.updateMany({ course: courseId }, { status: 'draft' }),
    ProjectTask.updateMany({ course: courseId }, { status: 'draft' }),
    RoadmapTemplate.updateMany({ course: courseId }, { status: 'draft' })
  ]);
};

export const updateTechnologySafely = async ({ id, payload }) => {
  if (Object.prototype.hasOwnProperty.call(payload, 'parentTechnology')) {
    await assertTechnologyParentValid({ id, parentTechnology: payload.parentTechnology });
  }
  return updateTechnology({ id, payload });
};

export const changeTechnologyStatusSafely = async (args) => {
  if (args.status === PUBLISHABLE_STATUS.ARCHIVED) await assertTechnologyArchiveSafe(args.id);
  return changeTechnologyStatus(args);
};

export const changeCourseStatusSafely = async (args) => {
  const course = ensureFound(await Course.findById(args.id).select('status'), 'Course');

  if (args.status === PUBLISHABLE_STATUS.ARCHIVED) {
    await assertCourseArchiveSafe(args.id);
    const updated = await changeCourseStatus(args);
    await archiveCourseOwnedContent(args.id);
    await invalidateContentCache();
    return updated;
  }

  if (args.status === PUBLISHABLE_STATUS.DRAFT && course.status === PUBLISHABLE_STATUS.ARCHIVED) {
    const updated = await changeCourseStatus(args);
    await restoreCourseOwnedContent(args.id);
    await invalidateContentCache();
    return updated;
  }

  return changeCourseStatus(args);
};

export const changeTemplateStatusSafely = async (args) => {
  if (args.status === PUBLISHABLE_STATUS.ARCHIVED) {
    await assertTemplateCanLeavePublishedCoverage(args.id);
  }

  if (args.status === PUBLISHABLE_STATUS.DRAFT) {
    const template = ensureFound(await RoadmapTemplate.findById(args.id).select('course status'), 'Roadmap template');
    if (template.status === PUBLISHABLE_STATUS.ARCHIVED) {
      const course = await Course.findById(template.course).select('status').lean();
      if (!course || course.status === PUBLISHABLE_STATUS.ARCHIVED) {
        throw dependencyError('This template cannot be restored while its Course is archived.', [
          instruction('course', 'Open Courses and restore the parent Course first.')
        ]);
      }
    }
  }

  return changeTemplateStatus(args);
};

export const deleteTechnologySafely = async (id) => {
  const technology = ensureFound(await Technology.findById(id), 'Technology');
  requireArchivedForDelete(technology, 'Technology');

  const [courses, paths, children] = await Promise.all([
    Course.countDocuments({ $or: [{ technologies: id }, { primaryTechnology: id }] }),
    LearningPath.countDocuments({ technologies: id }),
    Technology.countDocuments({ parentTechnology: id })
  ]);

  if (courses || paths || children) {
    throw dependencyError('This technology is still referenced, so it cannot be permanently deleted.', [
      ...(courses ? [instruction('courses', `${courses} course(s) still reference it. Remove the technology from those Courses first.`)] : []),
      ...(paths ? [instruction('learningPaths', `${paths} learning path(s) still reference it. Remove the technology from those Learning Paths first.`)] : []),
      ...(children ? [instruction('childTechnologies', `${children} child technology item(s) still use it as their parent. Reassign their parent first.`)] : [])
    ]);
  }

  return deleteTechnology(id);
};

export const deleteCourseSafely = async (id) => {
  const course = ensureFound(await Course.findById(id), 'Course');
  requireArchivedForDelete(course, 'Course');

  const [paths, prerequisiteUsers, enrollments, coursePlans] = await Promise.all([
    LearningPath.countDocuments({ 'courses.course': id }),
    Course.countDocuments({ recommendedPrerequisites: id }),
    Enrollment.countDocuments({ $or: [{ course: id }, { currentCourse: id }] }),
    CoursePlan.countDocuments({ course: id })
  ]);

  if (paths || prerequisiteUsers || enrollments || coursePlans) {
    throw dependencyError('This course still has external references or learner history, so it cannot be permanently deleted.', [
      ...(paths ? [instruction('learningPaths', `${paths} learning path(s) still include this Course. Remove the Course from those paths first.`)] : []),
      ...(prerequisiteUsers ? [instruction('recommendedPrerequisites', `${prerequisiteUsers} course(s) still reference it as a prerequisite. Remove the prerequisite first.`)] : []),
      ...(enrollments || coursePlans ? [instruction('learnerHistory', 'Learner enrollments or roadmaps already reference this Course. Keep the Course archived instead of deleting it.')] : [])
    ]);
  }

  await Promise.all([
    RoadmapTemplate.deleteMany({ course: id }),
    ProjectTask.deleteMany({ course: id }),
    InterviewQuestion.deleteMany({ course: id }),
    QuizQuestion.deleteMany({ course: id }),
    Lesson.deleteMany({ course: id }),
    Topic.deleteMany({ course: id })
  ]);
  return deleteCourse(id);
};

export const deleteLearningPathSafely = async (id) => {
  const path = ensureFound(await LearningPath.findById(id), 'Learning path');
  requireArchivedForDelete(path, 'Learning path');

  const [enrollments, coursePlans] = await Promise.all([
    Enrollment.countDocuments({ learningPath: id }),
    CoursePlan.countDocuments({ learningPath: id })
  ]);

  if (enrollments || coursePlans) {
    throw dependencyError('This learning path has learner history, so it cannot be permanently deleted.', [
      instruction('learnerHistory', 'Keep the Learning Path archived so existing learner roadmaps remain valid.')
    ]);
  }

  return deleteLearningPath(id);
};

export const deleteTemplateSafely = async (id) => {
  const template = ensureFound(await RoadmapTemplate.findById(id), 'Roadmap template');
  requireArchivedForDelete(template, 'Roadmap template');
  await assertTemplateCanLeavePublishedCoverage(id);
  return deleteTemplate(id);
};
