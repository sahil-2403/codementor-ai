import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('template admin separates archive, restore, and permanent deletion', () => {
  const routes = source('routes/admin.routes.js');
  const controller = source('controllers/admin.controller.js');
  const service = source('services/adminContent/template.service.js');
  const common = source('services/adminContent/common.js');

  assert.match(routes, /patch\('\/templates\/:id\/status'[\s\S]*updateTemplateStatus/);
  assert.match(routes, /delete\('\/templates\/:id'[\s\S]*deleteTemplate/);
  assert.doesNotMatch(routes, /templates\/:id\/duplicate/);
  assert.match(controller, /export const deleteTemplate[\s\S]*adminContent\.deleteTemplateSafely/);
  assert.match(controller, /export const updateTemplateStatus[\s\S]*adminContent\.changeTemplateStatusSafely/);
  assert.match(service, /requireArchivedForDelete\(template, 'Roadmap template'\)/);
  assert.match(service, /template\.deleteOne\(\)/);
  assert.match(common, /Archive this \$\{label\.toLowerCase\(\)\} before deleting it permanently/);
  assert.match(common, /PUBLISHABLE_STATUS\.ARCHIVED\]: new Set\(\[PUBLISHABLE_STATUS\.DRAFT\]\)/);
});

test('template publish validation is course-scoped and uses quiz-bank questions', () => {
  const service = source('services/adminContent/template.service.js');
  assert.match(service, /bank:\s*'quiz'/);
  assert.match(service, /course:\s*template\.course/);
  assert.match(service, /module\.lessons/);
  assert.match(service, /published Quiz-bank questions/);
  assert.doesNotMatch(service, /goalKey|lessonSlugs|legacyQuizBankFilter/);
});

test('template duration is derived from module durations on writes', () => {
  const service = source('services/adminContent/template.service.js');
  assert.match(service, /templateDurationDays/);
  assert.match(service, /estimatedDurationDays:\s*templateDurationDays\(modules\)/);
  assert.match(service, /normalized\.estimatedDurationDays\s*=\s*templateDurationDays\(normalized\.modules\)/);
});
