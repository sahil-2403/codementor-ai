import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('Gemini schemas constrain scores and require roadmap modules', () => {
  const schemas = source('ai/aiSchemas.js');
  assert.match(schemas, /projectReviewResponseSchema[\s\S]*score:\s*z\.coerce\.number\(\)\.min\(0\)\.max\(100\)/);
  assert.match(schemas, /interviewReviewResponseSchema[\s\S]*score:\s*z\.coerce\.number\(\)\.min\(0\)\.max\(100\)/);
  assert.match(schemas, /roadmapResponseSchema[\s\S]*modules:[\s\S]*\.min\(1\)/);
});

test('project and interview models declare atomic two-attempt indexes', () => {
  const projects = source('models/ProjectSubmission.js');
  const interviews = source('models/InterviewAttempt.js');
  assert.match(projects, /project_attempt_slot_unique/);
  assert.match(projects, /user:\s*1,\s*projectTask:\s*1,\s*attemptNumber:\s*1/);
  assert.match(interviews, /interview_attempt_slot_unique/);
  assert.match(interviews, /user:\s*1,\s*question:\s*1,\s*attemptNumber:\s*1/);
});

test('roadmap models declare job locks and output idempotency indexes', () => {
  const jobs = source('models/AIJob.js');
  const courses = source('models/CoursePlan.js');
  assert.match(jobs, /ai_job_idempotency_unique/);
  assert.match(jobs, /ai_job_active_lock_unique/);
  assert.match(courses, /course_generation_job_unique/);
  assert.match(courses, /course_generation_key_unique/);
});

test('roadmap worker records the correct terminal timestamp field', () => {
  const worker = source('workers/roadmap.worker.js');
  assert.match(worker, /completedAt:\s*hasMoreBullAttempts\s*\?\s*null\s*:\s*new Date\(\)/);
  assert.doesNotMatch(worker, /completdAt/);
});

test('mentor context is restricted to active course lessons', () => {
  const service = source('services/mentor.service.js');
  const routes = source('routes/mentor.routes.js');
  assert.match(service, /requireActiveCourseForUser/);
  assert.match(service, /assertLessonBelongsToCourse/);
  assert.match(service, /LESSON_NOT_AVAILABLE|CONTENT_LOCKED/);
  assert.match(routes, /validate\(mentorSuggestionsSchema\)/);
});

test('auth and csrf cookies use one configured policy', () => {
  const tokenService = source('services/token.service.js');
  const csrf = source('middlewares/csrf.middleware.js');
  const cookies = source('config/cookies.js');
  assert.match(tokenService, /accessCookieOptions/);
  assert.match(tokenService, /refreshCookieOptions/);
  assert.match(csrf, /csrfCookieOptions/);
  assert.match(csrf, /csrfHashCookieOptions/);
  assert.doesNotMatch(csrf, /process\.env/);
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
  assert.match(service, /\.limit\(Math\.min/);
  assert.match(routes, /aiRouteLimiter, generateReport/);
});

test('interview list filters are validated and regex escaped', () => {
  const routes = source('routes/interview.routes.js');
  const service = source('services/interview.service.js');
  assert.match(routes, /validate\(listInterviewQuestionsSchema\)/);
  assert.match(service, /new RegExp\(escapeRegex\(topic\), 'i'\)/);
});
