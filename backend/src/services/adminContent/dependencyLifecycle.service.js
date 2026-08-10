import { Technology } from '../../models/Technology.js';
import { Course } from '../../models/Course.js';
import { LearningPath } from '../../models/LearningPath.js';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { InterviewQuestion } from '../../models/InterviewQuestion.js';
import { ProjectTask } from '../../models/ProjectTask.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { CoursePlan } from '../../models/CoursePlan.js';
import { ApiError } from '../../utils/ApiError.js';
import { PUBLISHABLE_STATUS, ensureFound } from './common.js';
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

const assertTechnologyParentAcyclic = async ({ id, parentTechnology }) => {
  if (!parentTechnology) return;
  const target = String(id);
  let currentId = String(parentTechnology);
  const visited = new Set();

  while (currentId) {
    if (currentId === target) {
      throw new ApiError(400, 'Technology parent relationships cannot form a cycle', [
        { field: 'parentTechnology', message: 'Choose a parent that is not this technology or one of its descendants' }
      ], 'CATALOG_CYCLE');
    }
    if (visited.has(currentId)) {
      throw new ApiError(409, 'The existing technology hierarchy already contains a cycle', [], 'CATALOG_CYCLE');
    }
    visited.add(currentId);
    const technology = await Technology.findById(currentId).select('_id parentTechnology').lean();
    if (!technology?.parentTechnology) return;
    currentId = String(technology.parentTechnology);
  }
};

const assertTechnologyArchiveSafe = async (technologyId) => {
  const [courses, paths, children] = await Promise.all([
    Course.countDocuments({ status: activeCatalogFilter, $or: [{ technologies: technologyId }, { primaryTechnology: technologyId }] }),
    LearningPath.countDocuments({ status: activeCatalogFilter, technologies: technologyId }),
    Technology.countDocuments({ status: activeCatalogFilter, parentTechnology: technologyId })
  ]);

  if (courses || paths || children) {
    throw dependencyError('Remove this technology from active catalog dependencies before archiving it', [
      ...(courses ? [{ field: 'courses', message: `${courses} active course(s) use this technology` }] : []),
      ...(paths ? [{ field: 'learningPaths', message: `${paths} active learning path(s) use this technology` }] : []),
      ...(children ? [{ field: 'childTechnologies', message: `${children} active child technology item(s) use this as their parent` }] : [])
    ]);
  }
};

const assertCourseArchiveSafe = async (courseId) => {
  const [paths, prerequisiteUsers] = await Promise.all([
    LearningPath.countDocuments({ status: activeCatalogFilter, 'courses.course': courseId }),
    Course.countDocuments({ status: activeCatalogFilter, recommendedPrerequisites: courseId })
  ]);

  if (paths || prerequisiteUsers) {
    throw dependencyError('Remove this course from active catalog dependencies before archiving it', [
      ...(paths ? [{ field: 'learningPaths', message: `${paths} active learning path(s) include this course` }] : []),
      ...(prerequisiteUsers ? [{ field: 'recommendedPrerequisites', message: `${prerequisiteUsers} active course(s) recommend this course as a prerequisite` }] : [])
    ]);
  }
};

const assertTemplateCanLeavePublishedCoverage = async (templateId) => {
  const template = ensureFound(await RoadmapTemplate.findById(templateId).select('_id course level title status').lean(), 'Roadmap template');
  const course = await Course.findById(template.course).select('_id title status availableLevels').lean();
  const requiredByPublishedCourse = course?.status === PUBLISHABLE_STATUS.PUBLISHED && (course.availableLevels || []).includes(template.level);

  if (requiredByPublishedCourse) {
    throw dependencyError(
      `“${template.title}” is required by the published course “${course.title}”`,
      [{ field: 'course', message: 'Archive the Course first, then archive or delete this required roadmap template' }]
    );
  }
};

export const updateTechnologySafely = async ({ id, payload }) => {
  if (Object.prototype.hasOwnProperty.call(payload, 'parentTechnology')) {
    await assertTechnologyParentAcyclic({ id, parentTechnology: payload.parentTechnology });
  }
  return updateTechnology({ id, payload });
};

export const changeTechnologyStatusSafely = async (args) => {
  if (args.status === PUBLISHABLE_STATUS.ARCHIVED) await assertTechnologyArchiveSafe(args.id);
  return changeTechnologyStatus(args);
};

export const changeCourseStatusSafely = async (args) => {
  if (args.status === PUBLISHABLE_STATUS.ARCHIVED) await assertCourseArchiveSafe(args.id);
  return changeCourseStatus(args);
};

export const changeTemplateStatusSafely = async (args) => {
  if (args.status === PUBLISHABLE_STATUS.ARCHIVED) await assertTemplateCanLeavePublishedCoverage(args.id);
  return changeTemplateStatus(args);
};

export const deleteTechnologySafely = async (id) => {
  const childCount = await Technology.countDocuments({ parentTechnology: id });
  if (childCount) {
    throw dependencyError('Technology still has child technologies', [
      { field: 'childTechnologies', message: `${childCount} technology item(s) still reference this parent` }
    ]);
  }
  return deleteTechnology(id);
};

export const deleteCourseSafely = async (id) => {
  const [lessons, questions, interviews, projects, coursePlans, prerequisiteUsers] = await Promise.all([
    Lesson.countDocuments({ course: id }),
    QuizQuestion.countDocuments({ course: id }),
    InterviewQuestion.countDocuments({ course: id }),
    ProjectTask.countDocuments({ course: id }),
    CoursePlan.countDocuments({ course: id }),
    Course.countDocuments({ recommendedPrerequisites: id })
  ]);

  if (lessons || questions || interviews || projects || coursePlans || prerequisiteUsers) {
    throw dependencyError('Course still has content, history, or prerequisite dependencies', [
      ...(lessons ? [{ field: 'lessons', message: `${lessons} lesson(s) belong to this course` }] : []),
      ...(questions ? [{ field: 'questions', message: `${questions} quiz/skill-check question(s) belong to this course` }] : []),
      ...(interviews ? [{ field: 'interviewQuestions', message: `${interviews} interview question(s) belong to this course` }] : []),
      ...(projects ? [{ field: 'projects', message: `${projects} project task(s) belong to this course` }] : []),
      ...(coursePlans ? [{ field: 'coursePlans', message: `${coursePlans} generated learner roadmap(s) reference this course` }] : []),
      ...(prerequisiteUsers ? [{ field: 'recommendedPrerequisites', message: `${prerequisiteUsers} course(s) reference this as a prerequisite` }] : [])
    ]);
  }
  return deleteCourse(id);
};

export const deleteLearningPathSafely = async (id) => {
  const coursePlans = await CoursePlan.countDocuments({ learningPath: id });
  if (coursePlans) {
    throw dependencyError('Learning path has generated learner roadmap history and cannot be permanently deleted', [
      { field: 'coursePlans', message: `${coursePlans} generated roadmap(s) reference this learning path` }
    ]);
  }
  return deleteLearningPath(id);
};

export const deleteTemplateSafely = async (id) => {
  await assertTemplateCanLeavePublishedCoverage(id);
  return deleteTemplate(id);
};
