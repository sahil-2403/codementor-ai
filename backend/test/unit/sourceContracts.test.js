import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

const collectSourceFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
  if (entry.isDirectory()) return collectSourceFiles(path);
  return entry.name.endsWith('.js') ? [path] : [];
});

test('Gemini schemas constrain scores and require roadmap modules', () => {
  const schemas = source('ai/aiSchemas.js');
  assert.match(schemas, /practiceReviewResponseSchema[\s\S]*score:\s*z\.coerce\.number\(\)\.min\(0\)\.max\(100\)/);
  assert.match(schemas, /interviewReviewResponseSchema[\s\S]*score:\s*z\.coerce\.number\(\)\.min\(0\)\.max\(100\)/);
  assert.match(schemas, /roadmapResponseSchema[\s\S]*modules:[\s\S]*\.min\(1\)/);
});

test('practice and interview attempts use a simple two-attempt helper', () => {
  const helper = source('services/attempt.service.js');
  const practice = source('models/PracticeSubmission.js');
  const interviews = source('models/InterviewAttempt.js');

  assert.match(helper, /countDocuments\(identityFilter\)/);
  assert.match(helper, /attemptsUsed >= 2/);
  assert.match(helper, /attemptNumber: attemptsUsed \+ 1/);
  assert.match(practice, /attemptNumber:[\s\S]*required: true/);
  assert.match(interviews, /attemptNumber:[\s\S]*required: true/);
  assert.doesNotMatch(practice, /partialFilterExpression|attempt_slot_unique/);
  assert.doesNotMatch(interviews, /partialFilterExpression|attempt_slot_unique/);
});

test('roadmap generation uses direct sequential mongoose operations', () => {
  const controller = source('controllers/roadmap.controller.js');
  const service = source('services/roadmap.service.js');
  const routes = source('routes/roadmap.routes.js');

  assert.match(controller, /createCourseFromTemplate/);
  assert.match(routes, /post\('\/generate-or-get'/);
  assert.match(service, /CoursePlan\.create/);
  assert.match(service, /enrollment\.save\(\)/);
  assert.doesNotMatch(service, /startSession|withTransaction|session\(/);
});

test('backend runtime queries Mongo directly and keeps one simple health endpoint', () => {
  const env = source('config/env.js');
  const app = source('app.js');
  const server = source('server.js');
  const slug = source('utils/generateSlug.js');
  const lessons = source('services/lesson.service.js');

  assert.doesNotMatch(env, /ENABLE_CACHE|enableCache|CACHE_/);
  assert.doesNotMatch(server, /cache/i);
  assert.match(app, /app\.get\('\/health'/);
  assert.doesNotMatch(app, /health\/ready|getReadiness/);
  assert.match(lessons, /Lesson\.findOne/);
  assert.doesNotMatch(lessons, /getOrSetCache|cacheKey/);
  assert.match(slug, /normalize\('NFKD'\)/);
  assert.match(slug, /replace\(\/\[\^a-z0-9\]\+\/g, '-'\)/);
});

test('deleted cache invalidation service is not imported anywhere', () => {
  const srcRoot = new URL('../../src/', import.meta.url);
  const staleFiles = collectSourceFiles(srcRoot)
    .filter((file) => readFileSync(file, 'utf8').includes('cacheInvalidation.service'))
    .map((file) => file.pathname);

  assert.deepEqual(staleFiles, []);
});

test('mentor context is restricted to active course lessons', () => {
  const mentor = source('services/mentor.service.js');
  const context = source('services/learningContext.service.js');
  const routes = source('routes/mentor.routes.js');

  assert.match(mentor, /requireActiveCourseForUser/);
  assert.match(mentor, /assertLessonBelongsToCourse/);
  assert.match(context, /course: courseId/);
  assert.match(routes, /validate\(mentorSuggestionsSchema\)/);
});

test('AI request validation stays simple and bounded', () => {
  const safety = source('services/aiSafety.service.js');
  const usage = source('services/aiUsage.service.js');

  assert.match(safety, /Maximum allowed characters/);
  assert.match(safety, /UNSUPPORTED_AI_PATTERNS/);
  assert.doesNotMatch(safety, /fingerprint|repeatedCount|REPEAT_WINDOW/i);
  assert.match(usage, /countDocuments/);
  assert.doesNotMatch(usage, /inputTokens|outputTokens|latencyMs|estimatedCost|promptFingerprint/);
});

test('auth and csrf cookies use the simple shared cookie policy', () => {
  const tokenService = source('services/token.service.js');
  const csrf = source('middlewares/csrf.middleware.js');
  const cookies = source('config/cookies.js');
  assert.match(tokenService, /accessCookieOptions/);
  assert.match(tokenService, /refreshCookieOptions/);
  assert.match(csrf, /csrfCookieOptions/);
  assert.match(csrf, /csrfCookie !== csrfHeader/);
  assert.doesNotMatch(csrf, /csrfHash|process\.env/);
  assert.match(cookies, /env\.cookieSameSite/);
  assert.match(cookies, /env\.cookieDomain/);
  assert.match(cookies, /durationToMs\(env\.jwtAccessExpiresIn/);
});

test('weekly reports are unique per user course and UTC week', () => {
  const model = source('models/WeeklyReport.js');
  const service = source('services/report.service.js');
  const routes = source('routes/report.routes.js');
  assert.match(model, /weekly_report_period_unique/);
  assert.match(model, /user:\s*1,\s*coursePlan:\s*1,\s*weekStart:\s*1/);
  assert.match(service, /getUtcWeekStart/);
  assert.match(service, /checkAIUsageLimit\(userId, AI_FEATURES\.WEEKLY_REPORT\)/);
  assert.match(routes, /aiRouteLimiter, generateReport/);
});

test('interview list filters are validated and regex escaped', () => {
  const routes = source('routes/interview.routes.js');
  const service = source('services/interview.service.js');
  assert.match(routes, /validate\(listInterviewQuestionsSchema\)/);
  assert.match(service, /new RegExp\(escapeRegex\(topic\), 'i'\)/);
});
