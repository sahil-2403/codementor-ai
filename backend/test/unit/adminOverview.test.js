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

test('content overview is backed by real content counts and relationships', () => {
  const service = source('services/adminContent/overview.service.js');

  assert.match(service, /Topic\.countDocuments\(\)/);
  assert.match(service, /Lesson\.countDocuments\(\)/);
  assert.match(service, /QuizQuestion\.countDocuments\(legacyQuizBankFilter\)/);
  assert.match(service, /QuizQuestion\.countDocuments\(\{ bank: 'skill_check' \}\)/);
  assert.match(service, /InterviewQuestion\.countDocuments\(\)/);
  assert.match(service, /RoadmapTemplate\.countDocuments\(\)/);
  assert.match(service, /topicsWithoutLessons/);
  assert.match(service, /publishedLessonsWithoutQuizCoverage/);
  assert.match(service, /recentContent/);
});

test('overview quiz coverage keeps legacy quiz-bank compatibility', () => {
  const service = source('services/adminContent/overview.service.js');
  assert.match(service, /legacyQuizBankFilter/);
  assert.match(service, /bank:\s*'quiz'/);
  assert.match(service, /bank:\s*\{\s*\$exists:\s*false\s*\}/);
});
