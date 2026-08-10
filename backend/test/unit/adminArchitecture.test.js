import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('admin router mounts catalog workspace and project task endpoints', () => {
  const routes = source('routes/admin.routes.js');
  assert.match(routes, /get\('\/courses\/:id\/workspace'[\s\S]*courseWorkspace/);
  assert.match(routes, /get\('\/project-tasks'[\s\S]*listAdminProjectTasks/);
  assert.match(routes, /post\('\/project-tasks'[\s\S]*createAdminProjectTask/);
  assert.match(routes, /patch\('\/project-tasks\/:id\/status'[\s\S]*updateAdminProjectTaskStatus/);
  assert.match(routes, /delete\('\/project-tasks\/:id'[\s\S]*deleteAdminProjectTask/);
});

test('archived publishable catalog entities restore only to draft', () => {
  const common = source('services/adminContent/common.js');
  assert.match(common, /PUBLISHABLE_STATUS\.ARCHIVED\]: new Set\(\[PUBLISHABLE_STATUS\.DRAFT\]\)/);
  assert.doesNotMatch(common, /PUBLISHABLE_STATUS\.ARCHIVED\]: new Set\(\[[^\]]*PUBLISHABLE_STATUS\.PUBLISHED/);
});

test('draft courses can stage curriculum while course publishing remains the final gate', () => {
  const common = source('services/adminContent/common.js');
  const catalog = source('services/adminContent/catalog.service.js');
  const readiness = source('services/adminContent/courseReadiness.service.js');

  assert.doesNotMatch(common, /Course must be published first/);
  assert.match(catalog, /assertCourseReadyForCatalog\(course\)/);
  assert.match(readiness, /RoadmapTemplate\.find\(\{ course: course\._id[\s\S]*status: 'published'/);
  assert.match(readiness, /Publish the \$\{level\} roadmap template before publishing this Course/);
});

test('course-owned model validation tolerates populated references', () => {
  for (const path of [
    'models/Topic.js',
    'models/Lesson.js',
    'models/QuizQuestion.js',
    'models/InterviewQuestion.js',
    'models/ProjectTask.js',
    'models/RoadmapTemplate.js'
  ]) {
    const model = source(path);
    assert.match(model, /referenceId/);
  }
});

test('project task history checks use the real projectTask submission reference', () => {
  const service = source('services/adminContent/projectTask.service.js');
  assert.match(service, /ProjectSubmission\.countDocuments\(\{ projectTask: project\._id \}\)/);
  assert.doesNotMatch(service, /ProjectSubmission\.countDocuments\(\{ task:/);
});

test('catalog archives cannot break active dependency chains', () => {
  const lifecycle = source('services/adminContent/dependencyLifecycle.service.js');
  const catalogController = source('controllers/adminCatalog.controller.js');
  const contentController = source('controllers/admin.controller.js');

  assert.match(lifecycle, /assertTechnologyArchiveSafe/);
  assert.match(lifecycle, /active course\(s\) use this technology/);
  assert.match(lifecycle, /assertCourseArchiveSafe/);
  assert.match(lifecycle, /active learning path\(s\) include this course/);
  assert.match(lifecycle, /assertTemplateCanLeavePublishedCoverage/);
  assert.match(lifecycle, /Archive the Course first, then archive or delete this required roadmap template/);
  assert.match(catalogController, /changeTechnologyStatusSafely/);
  assert.match(catalogController, /changeCourseStatusSafely/);
  assert.match(contentController, /changeTemplateStatusSafely/);
  assert.match(contentController, /deleteTemplateSafely/);
});

test('permanent catalog deletion protects deep content and learner history', () => {
  const lifecycle = source('services/adminContent/dependencyLifecycle.service.js');
  const catalogController = source('controllers/adminCatalog.controller.js');

  assert.match(lifecycle, /Technology\.countDocuments\(\{ parentTechnology: id \}\)/);
  assert.match(lifecycle, /Lesson\.countDocuments\(\{ course: id \}\)/);
  assert.match(lifecycle, /QuizQuestion\.countDocuments\(\{ course: id \}\)/);
  assert.match(lifecycle, /InterviewQuestion\.countDocuments\(\{ course: id \}\)/);
  assert.match(lifecycle, /ProjectTask\.countDocuments\(\{ course: id \}\)/);
  assert.match(lifecycle, /CoursePlan\.countDocuments\(\{ course: id \}\)/);
  assert.match(lifecycle, /CoursePlan\.countDocuments\(\{ learningPath: id \}\)/);
  assert.match(catalogController, /deleteTechnologySafely/);
  assert.match(catalogController, /deleteCourseSafely/);
  assert.match(catalogController, /deleteLearningPathSafely/);
});
