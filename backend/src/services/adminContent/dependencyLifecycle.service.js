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

const rememberedPublishableStatus = (...fallbackFields) => {
  let fallback = 'draft';
  for (let index = fallbackFields.length - 1; index >= 0; index -= 1) {
    const field = fallbackFields[index];
    fallback = {
      $cond: [
        { $in: [`$${field}`, ['draft', 'published']] },
        `$${field}`,
        fallback
      ]
    };
  }
  return {
    $cond: [
      { $in: ['$status', ['draft', 'published']] },
      '$status',
      fallback
    ]
  };
};

const assertTechnologyParentAcyclic = async ({ id, parentTechnology }) => {
  if (!parentTechnology) return;
  const target = String(id);
  let currentId = String(parentTechnology);
  const visited = new Set();

  while (currentId) {
    if (currentId === target) {
      throw new ApiError(400, 'Technology parent relationships cannot form a cycle', [
        instruction('parentTechnology', 'Choose a parent that is not this technology or one of its descendants.')
      ], 'CATALOG_CYCLE');
    }
    if (visited.has(currentId)) {
      throw new ApiError(409, 'The existing technology hierarchy already contains a cycle', [
        instruction('parentTechnology', 'Remove the circular parent relationship before saving this technology.')
      ], 'CATALOG_CYCLE');
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
    throw dependencyError('This technology is still used by active catalog items, so it cannot be archived yet.', [
      ...(courses ? [instruction('courses', `${courses} active course(s) use it. Open Courses and remove or replace this technology first.`)] : []),
      ...(paths ? [instruction('learningPaths', `${paths} active learning path(s) use it. Open Learning Paths and remove this technology first.`)] : []),
      ...(children ? [instruction('childTechnologies', `${children} active child technology item(s) use it as their parent. Reassign or remove their parent first.`)] : [])
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
      ...(prerequisiteUsers ? [instruction('recommendedPrerequisites', `${prerequisiteUsers} active course(s) recommend this course as a prerequisite. Open those Courses and remove the prerequisite first.`)] : [])
    ]);
  }
};

const assertTemplateCanLeavePublishedCoverage = async (templateId) => {
  const template = ensureFound(await RoadmapTemplate.findById(templateId).select('_id course level title status').lean(), 'Roadmap template');
  const course = await Course.findById(template.course).select('_id title status availableLevels').lean();
  const requiredByPublishedCourse = course?.status === PUBLISHABLE_STATUS.PUBLISHED && (course.availableLevels || []).includes(template.level);

  if (requiredByPublishedCourse) {
    throw dependencyError(
      `This template is required by the published course “${course.title}”.`,
      [instruction('course', 'Archive the Course instead. Course archiving automatically archives all of its Templates and curriculum, so you do not need to archive child content first.')]
    );
  }
};

const archiveCourseOwnedContent = async (courseId) => {
  await Promise.all([
    Topic.updateMany(
      { course: courseId },
      { $set: { status: 'archived', statusBeforeCourseArchive: 'active' } }
    ),
    Lesson.updateMany(
      { course: courseId },
      [{ $set: {
        statusBeforeCourseArchive: rememberedPublishableStatus(
          'statusBeforeCourseArchive',
          'statusBeforeCascadeArchive',
          'statusBeforeTopicArchive'
        ),
        status: 'archived'
      } }]
    ),
    QuizQuestion.updateMany(
      { course: courseId },
      [{ $set: {
        statusBeforeCourseArchive: rememberedPublishableStatus(
          'statusBeforeCourseArchive',
          'statusBeforeManualArchive',
          'statusBeforeCascadeArchive',
          'statusBeforeTopicArchive'
        ),
        status: 'archived'
      } }]
    ),
    InterviewQuestion.updateMany(
      { course: courseId },
      [{ $set: {
        statusBeforeCascadeArchive: rememberedPublishableStatus(
          'statusBeforeCascadeArchive',
          'statusBeforeManualArchive',
          'statusBeforeTopicArchive'
        ),
        status: 'archived'
      } }]
    ),
    ProjectTask.updateMany(
      { course: courseId },
      [{ $set: {
        statusBeforeCascadeArchive: rememberedPublishableStatus('statusBeforeCascadeArchive'),
        status: 'archived'
      } }]
    ),
    RoadmapTemplate.updateMany(
      { course: courseId },
      [{ $set: {
        statusBeforeCourseArchive: rememberedPublishableStatus('statusBeforeCourseArchive'),
        status: 'archived'
      } }]
    )
  ]);
};

const restoreCourseOwnedContent = async (courseId) => {
  await Promise.all([
    Topic.updateMany(
      { course: courseId },
      { $set: { status: 'active', statusBeforeCourseArchive: null } }
    ),
    Lesson.updateMany(
      { course: courseId },
      [{ $set: {
        status: { $cond: [{ $in: ['$statusBeforeCourseArchive', ['draft', 'published']] }, '$statusBeforeCourseArchive', 'draft'] },
        statusBeforeCourseArchive: null,
        manualArchive: false,
        archivedByTopics: [],
        statusBeforeCascadeArchive: null,
        statusBeforeTopicArchive: null
      } }]
    ),
    QuizQuestion.updateMany(
      { course: courseId },
      [{ $set: {
        status: { $cond: [{ $in: ['$statusBeforeCourseArchive', ['draft', 'published']] }, '$statusBeforeCourseArchive', 'draft'] },
        statusBeforeCourseArchive: null,
        manualArchive: false,
        statusBeforeManualArchive: null,
        archivedByTopics: [],
        archivedByLessons: [],
        statusBeforeCascadeArchive: null,
        statusBeforeTopicArchive: null
      } }]
    ),
    InterviewQuestion.updateMany(
      { course: courseId },
      [{ $set: {
        status: { $cond: [{ $in: ['$statusBeforeCascadeArchive', ['draft', 'published']] }, '$statusBeforeCascadeArchive', 'draft'] },
        manualArchive: false,
        statusBeforeManualArchive: null,
        archivedByTopics: [],
        statusBeforeCascadeArchive: null,
        statusBeforeTopicArchive: null
      } }]
    ),
    ProjectTask.updateMany(
      { course: courseId },
      [{ $set: {
        status: { $cond: [{ $in: ['$statusBeforeCascadeArchive', ['draft', 'published']] }, '$statusBeforeCascadeArchive', 'draft'] },
        archivedByTopics: [],
        archivedByLessons: [],
        statusBeforeCascadeArchive: null,
        statusBeforeTopicArchive: null
      } }]
    ),
    RoadmapTemplate.updateMany(
      { course: courseId },
      [{ $set: {
        status: { $cond: [{ $in: ['$statusBeforeCourseArchive', ['draft', 'published']] }, '$statusBeforeCourseArchive', 'draft'] },
        statusBeforeCourseArchive: null
      } }]
    )
  ]);
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
  const course = ensureFound(await Course.findById(args.id).select('_id status'), 'Course');

  if (args.status === PUBLISHABLE_STATUS.ARCHIVED) {
    await assertCourseArchiveSafe(args.id);
    await archiveCourseOwnedContent(args.id);
    return changeCourseStatus(args);
  }

  if (args.status === PUBLISHABLE_STATUS.DRAFT && course.status === PUBLISHABLE_STATUS.ARCHIVED) {
    const restored = await changeCourseStatus(args);
    await restoreCourseOwnedContent(args.id);
    await invalidateContentCache();
    return restored;
  }

  return changeCourseStatus(args);
};

export const changeTemplateStatusSafely = async (args) => {
  if (args.status === PUBLISHABLE_STATUS.ARCHIVED) {
    await assertTemplateCanLeavePublishedCoverage(args.id);
    const template = ensureFound(await RoadmapTemplate.findById(args.id).select('status'), 'Roadmap template');
    if ([PUBLISHABLE_STATUS.DRAFT, PUBLISHABLE_STATUS.PUBLISHED].includes(template.status)) {
      await RoadmapTemplate.updateOne(
        { _id: args.id },
        { $set: { statusBeforeCourseArchive: template.status } }
      );
    }
  }

  if (args.status === PUBLISHABLE_STATUS.DRAFT) {
    const template = ensureFound(await RoadmapTemplate.findById(args.id).select('course status'), 'Roadmap template');
    if (template.status === PUBLISHABLE_STATUS.ARCHIVED) {
      const course = await Course.findById(template.course).select('status').lean();
      if (!course || course.status === PUBLISHABLE_STATUS.ARCHIVED) {
        throw dependencyError('This template cannot be restored while its Course is archived.', [
          instruction('course', 'Open Courses and restore the parent Course first. Restoring the Course will restore all of its Templates and curriculum automatically.')
        ]);
      }
    }
  }

  const template = await changeTemplateStatus(args);
  if (args.status === PUBLISHABLE_STATUS.DRAFT) {
    await RoadmapTemplate.updateOne({ _id: args.id }, { $set: { statusBeforeCourseArchive: null } });
  }
  return template;
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
      ...(courses ? [instruction('courses', `${courses} course(s) still reference it. If one is archived, restore that Course to Draft first, remove the technology, then archive the Course again if needed.`)] : []),
      ...(paths ? [instruction('learningPaths', `${paths} learning path(s) still reference it. If one is archived, restore that Learning Path to Draft first, remove the technology, then archive it again if needed.`)] : []),
      ...(children ? [instruction('childTechnologies', `${children} child technology item(s) still use it as their parent. Reassign or remove their parent first.`)] : [])
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
      ...(paths ? [instruction('learningPaths', `${paths} learning path(s) still include this Course. Restore an archived Learning Path to Draft if necessary, remove this Course, then archive the path again if needed.`)] : []),
      ...(prerequisiteUsers ? [instruction('recommendedPrerequisites', `${prerequisiteUsers} course(s) still reference it as a prerequisite. Restore an archived Course to Draft if necessary, remove the prerequisite, then archive it again if needed.`)] : []),
      ...(enrollments || coursePlans ? [instruction('learnerHistory', 'Learner enrollments or generated roadmaps already reference this Course. Keep the Course archived instead of deleting it.')] : [])
    ]);
  }

  await Promise.all([
    RoadmapTemplate.deleteMany({ course: id }),
    ProjectTask.deleteMany({ course: id }),
    InterviewQuestion.deleteMany({ course: id }),
    QuizQuestion.deleteMany({ course: id })
  ]);
  await Lesson.deleteMany({ course: id });
  await Topic.deleteMany({ course: id });
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
      instruction('learnerHistory', 'Keep the Learning Path archived. Existing learner enrollments and generated roadmaps must remain valid.')
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
