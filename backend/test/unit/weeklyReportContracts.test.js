import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('weekly reports use current-week course activity instead of cumulative progress only', () => {
  const service = source('services/report.service.js');

  assert.match(service, /buildWeeklyActivity/);
  assert.match(service, /createdAt:\s*\{ \$gte: weekStart \}/);
  assert.match(service, /lessonsCompleted/);
  assert.match(service, /quizAttempts/);
  assert.match(service, /practiceAttempts/);
  assert.match(service, /interviewAttempts/);
  assert.match(service, /mentorQuestions/);
  assert.match(service, /previousReport/);
  assert.match(service, /improvements/);
});

test('weekly report AI receives only the prepared weekly snapshot', () => {
  const service = source('services/report.service.js');
  const provider = source('ai/aiProvider.service.js');
  const prompt = source('ai/promptBuilders.js');
  const schema = source('ai/aiSchemas.js');

  assert.match(service, /generateWeeklyReport\(\{ weeklySnapshot \}\)/);
  assert.match(provider, /generateWeeklyReport\(\{ weeklySnapshot \}\)/);
  assert.match(prompt, /buildWeeklyReportPrompt = \(\{ weeklySnapshot \}\)/);
  assert.match(prompt, /Do not invent activity or progress/);
  assert.match(schema, /weeklyReportResponseSchema[\s\S]*improvements/);
});
