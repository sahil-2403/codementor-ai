import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('template admin separates archive from permanent deletion', () => {
  const routes = source('routes/admin.routes.js');
  const controller = source('controllers/admin.controller.js');
  const service = source('services/adminContent/template.service.js');

  assert.match(routes, /patch\('\/templates\/:id\/status'[\s\S]*updateTemplateStatus/);
  assert.match(routes, /delete\('\/templates\/:id'[\s\S]*deleteTemplate/);
  assert.doesNotMatch(routes, /templates\/:id\/duplicate/);
  assert.match(controller, /export const deleteTemplate[\s\S]*adminContent\.deleteTemplate/);
  assert.match(service, /template\.deleteOne\(\)/);
  assert.match(service, /TEMPLATE_DELETE_REQUIRES_ARCHIVE/);
});

test('template publish validation uses only roadmap quiz-bank questions', () => {
  const service = source('services/adminContent/template.service.js');
  assert.match(service, /legacyQuizBankFilter/);
  assert.match(service, /bank:\s*'quiz'/);
  assert.match(service, /QuizQuestion\.find\([\s\S]*legacyQuizBankFilter/);
  assert.match(service, /published quiz questions/);
});

test('template duration is derived from module durations on writes', () => {
  const service = source('services/adminContent/template.service.js');
  assert.match(service, /templateDurationDays/);
  assert.match(service, /estimatedDurationDays:\s*templateDurationDays\(modules\)/);
  assert.match(service, /normalized\.estimatedDurationDays\s*=\s*templateDurationDays\(normalized\.modules\)/);
});
