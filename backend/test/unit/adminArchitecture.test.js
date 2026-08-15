import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('admin router mounts catalog workspace and practice task endpoints', () => {
  const routes = source('routes/admin.routes.js');
  assert.match(routes, /get\('\/courses\/:id\/workspace'[\s\S]*courseWorkspace/);
  assert.match(routes, /get\('\/practice-tasks'[\s\S]*listAdminPracticeTasks/);
  assert.match(routes, /post\('\/practice-tasks'[\s\S]*createAdminPracticeTask/);
  assert.match(routes, /patch\('\/practice-tasks\/:id\/status'[\s\S]*updateAdminPracticeTaskStatus/);
  assert.match(routes, /delete\('\/practice-tasks\/:id'[\s\S]*deleteAdminPracticeTask/);
});

test('archived publishable catalog entities restore only to draft', () => {
  const common = source('services/adminContent/common.js');
  assert.match(common, /PUBLISHABLE_STATUS\.ARCHIVED\]: new Set\(\[PUBLISHABLE_STATUS\.DRAFT\]\)/);
});

test('all permanent admin deletion requires archived state', () => {
  const common = source('services/adminContent/common.js');
  const lifecycle = source('services/adminContent/dependencyLifecycle.service.js');
  const topic = source('services/adminContent/topic.service.js');
  const lesson = source('services/adminContent/lesson.service.js');
  const question = source('services/adminContent/question.service.js');
  const interview = source('services/adminContent/interviewQuestion.service.js');
  const practice = source('services/adminContent/practiceTask.service.js');
  const template = source('services/adminContent/template.service.js');

  assert.match(common, /export const requireArchivedForDelete/);
  assert.match(lifecycle, /requireArchivedForDelete\(technology, 'Technology'\)/);
  assert.match(lifecycle, /requireArchivedForDelete\(course, 'Course'\)/);
  assert.match(lifecycle, /requireArchivedForDelete\(path, 'Learning path'\)/);
  assert.match(topic, /requireArchivedForDelete\(topic, 'Topic'\)/);
  assert.match(lesson, /requireArchivedForDelete\(lesson, 'Lesson'\)/);
  assert.match(question, /requireArchivedForDelete\(question,/);
  assert.match(interview, /requireArchivedForDelete\(impact\.question, 'Interview question'\)/);
  assert.match(practice, /requireArchivedForDelete\(practiceTask, 'Practice task'\)/);
  assert.match(template, /requireArchivedForDelete\(template, 'Roadmap template'\)/);
});

test('draft courses can stage curriculum while course publishing remains the final gate', () => {
  const common = source('services/adminContent/common.js');
  const catalog = source('services/adminContent/catalog.service.js');
  const readiness = source('services/adminContent/courseReadiness.service.js');

  assert.match(common, /Choose a Draft or Published course/);
  assert.match(catalog, /assertCourseReadyForCatalog\(course\)/);
  assert.match(readiness, /RoadmapTemplate\.find\(\{ course: course\._id[\s\S]*status: 'published'/);
});

test('course-owned model validation tolerates populated references', () => {
  for (const path of [
    'models/Topic.js',
    'models/Lesson.js',
    'models/QuizQuestion.js',
    'models/InterviewQuestion.js',
    'models/PracticeTask.js',
    'models/RoadmapTemplate.js'
  ]) {
    assert.match(source(path), /referenceId/);
  }
});

test('practice task history checks use the practiceTask submission reference', () => {
  const service = source('services/adminContent/practiceTask.service.js');
  assert.match(service, /PracticeSubmission\.countDocuments\(\{ practiceTask: practiceTask\._id \}\)/);
});

test('course lifecycle uses simple downward status updates', () => {
  const lifecycle = source('services/adminContent/dependencyLifecycle.service.js');

  assert.match(lifecycle, /const archiveCourseOwnedContent/);
  assert.match(lifecycle, /const restoreCourseOwnedContent/);
  assert.match(lifecycle, /Topic\.updateMany\(\{ course: courseId \}, \{ status: 'archived' \}\)/);
  assert.match(lifecycle, /Topic\.updateMany\(\{ course: courseId \}, \{ status: 'active' \}\)/);
  for (const model of ['Lesson', 'QuizQuestion', 'InterviewQuestion', 'PracticeTask', 'RoadmapTemplate']) {
    assert.match(lifecycle, new RegExp(`${model}\\.updateMany\\(\\{ course: courseId \\}, \\{ status: 'draft' \\}\\)`));
  }
  assert.doesNotMatch(lifecycle, /statusBefore|manualArchive|archivedBy|\$cond/);
});

test('catalog archives protect external references and explain blockers', () => {
  const lifecycle = source('services/adminContent/dependencyLifecycle.service.js');
  const catalogController = source('controllers/adminCatalog.controller.js');
  const contentController = source('controllers/admin.controller.js');

  assert.match(lifecycle, /assertTechnologyArchiveSafe/);
  assert.match(lifecycle, /Open Courses and remove or replace this technology first/);
  assert.match(lifecycle, /assertCourseArchiveSafe/);
  assert.match(lifecycle, /Open Learning Paths and remove the course first/);
  assert.match(lifecycle, /assertTemplateCanLeavePublishedCoverage/);
  assert.match(catalogController, /changeTechnologyStatusSafely/);
  assert.match(catalogController, /changeCourseStatusSafely/);
  assert.match(contentController, /changeTemplateStatusSafely/);
});

test('technology parent validation stays simple', () => {
  const lifecycle = source('services/adminContent/dependencyLifecycle.service.js');
  const controller = source('controllers/adminCatalog.controller.js');

  assert.match(lifecycle, /assertTechnologyParentValid/);
  assert.match(lifecycle, /A technology cannot be its own parent/);
  assert.match(lifecycle, /Selected parent technology is unavailable/);
  assert.doesNotMatch(lifecycle, /visited|while \(currentId\)/);
  assert.match(controller, /updateTechnologySafely/);
});

test('course permanent deletion cascades owned content but protects external references and history', () => {
  const lifecycle = source('services/adminContent/dependencyLifecycle.service.js');
  const catalogController = source('controllers/adminCatalog.controller.js');

  assert.match(lifecycle, /LearningPath\.countDocuments\(\{ 'courses\.course': id \}\)/);
  assert.match(lifecycle, /Course\.countDocuments\(\{ recommendedPrerequisites: id \}\)/);
  assert.match(lifecycle, /Enrollment\.countDocuments/);
  assert.match(lifecycle, /CoursePlan\.countDocuments\(\{ course: id \}\)/);
  for (const model of ['RoadmapTemplate', 'PracticeTask', 'InterviewQuestion', 'QuizQuestion', 'Lesson', 'Topic']) {
    assert.match(lifecycle, new RegExp(`${model}\\.deleteMany\\(\\{ course: id \\}\\)`));
  }
  assert.match(lifecycle, /Learner enrollments or roadmaps already reference this Course/);
  assert.match(catalogController, /deleteTechnologySafely/);
  assert.match(catalogController, /deleteCourseSafely/);
  assert.match(catalogController, /deleteLearningPathSafely/);
});
