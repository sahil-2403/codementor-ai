import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('admin exposes one dedicated content overview endpoint', () => {
  const routes = source('routes/admin.routes.js');
  const controller = source('controllers/adminOverview.controller.js');

  assert.match(routes, /get\('\/content-overview',\s*contentOverview\)/);
  assert.match(controller, /getContentOverview\(\)/);
  assert.match(controller, /Admin content overview/);
});

test('content overview reports catalog and course-owned content', () => {
  const service = source('services/adminContent/overview.service.js');

  assert.match(service, /Technology\.countDocuments\(\)/);
  assert.match(service, /Course\.countDocuments\(\)/);
  assert.match(service, /LearningPath\.countDocuments\(\)/);
  assert.match(service, /Topic\.countDocuments\(\)/);
  assert.match(service, /Lesson\.countDocuments\(\)/);
  assert.match(service, /QuizQuestion\.countDocuments\(\{ bank: 'quiz' \}\)/);
  assert.match(service, /QuizQuestion\.countDocuments\(\{ bank: 'skill_check' \}\)/);
  assert.match(service, /InterviewQuestion\.countDocuments\(\)/);
  assert.match(service, /RoadmapTemplate\.countDocuments\(\)/);
  assert.match(service, /topicsWithoutLessons/);
  assert.match(service, /publishedLessonsWithoutQuizCoverage/);
  assert.match(service, /templateByCourseLevel/);
  assert.match(service, /recentContent/);
});

test('overview template coverage is keyed by course and level', () => {
  const service = source('services/adminContent/overview.service.js');
  assert.match(service, /\$\{template\.course\}:\$\{template\.level\}/);
  assert.match(service, /courseId:\s*course\._id/);
  assert.match(service, /courseStatus:\s*course\.status/);
  assert.match(service, /missingPublishedTemplateLevels/);
  assert.doesNotMatch(service, /goalKey|legacyQuizBankFilter/);
});
