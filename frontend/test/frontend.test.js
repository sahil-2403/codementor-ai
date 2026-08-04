import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { onboardingCopyByLevel, onboardingSteps } from '../src/constants/onboardingSteps.js';
import { queryKeys } from '../src/constants/queryKeys.js';
import { ASSESSMENT_STATUS, CONTENT_STATUS, COURSE_STATUS, formatDomainLabel, getStatusTone, JOB_STATUS, LEARNING_ITEM_STATUS, ONBOARDING_STATE, REVIEW_MODE, REVIEW_STATUS, REVISION_STATUS, ROADMAP_TYPE, SEVERITY } from '../src/constants/domainEnums.js';
import { cn } from '../src/utils/cn.js';
import { formatDate } from '../src/utils/formatDate.js';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(frontendRoot, '..');
const readFrontend = (path) => readFile(resolve(frontendRoot, path), 'utf8');
const readRepo = (path) => readFile(resolve(repoRoot, path), 'utf8');

test('shared utilities keep class names and empty dates deterministic', () => {
  assert.equal(cn('base', false, undefined, 'active'), 'base active');
  assert.equal(cn('', null, 'visible'), 'visible');
  assert.equal(formatDate(null), '—');
  assert.match(formatDate('2026-08-04T00:00:00.000Z'), /2026/);
});

test('onboarding copy preserves beginner and optional-diagnostic paths', () => {
  assert.deepEqual(onboardingSteps.map((step) => step.key), ['goal', 'level', 'setup', 'roadmap']);
  assert.equal(onboardingCopyByLevel.beginner.badge, 'No assessment required');
  assert.match(onboardingCopyByLevel.intermediate.badge, /optional/i);
  assert.match(onboardingCopyByLevel.advanced.badge, /optional/i);
});

test('query keys separate learner and admin caches', () => {
  assert.deepEqual(queryKeys.lesson('lesson-1'), ['lesson', 'lesson-1']);
  assert.deepEqual(queryKeys.quizAttempt('attempt-1'), ['quiz-attempt', 'attempt-1']);
  assert.deepEqual(queryKeys.interviewAttempts, ['interview-attempts']);
  assert.deepEqual(queryKeys.adminInterviewQuestions({ status: 'draft' }), ['admin-interview-questions', { status: 'draft' }]);
});

test('auth transport keeps cookie, CSRF, and refresh contracts', async () => {
  const source = await readFrontend('src/api/axiosInstance.js');
  assert.match(source, /withCredentials:\s*true/);
  assert.match(source, /X-CSRF-Token/);
  assert.match(source, /auth\/refresh-token/);
  assert.match(source, /_retry/);
});

test('password recovery uses a generic non-enumerating success message', async () => {
  const source = await readFrontend('src/pages/public/ForgotPasswordPage.jsx');
  assert.match(source, /If the email exists/i);
  assert.doesNotMatch(source, /account exists|email is registered/i);
});

test('onboarding navigation is driven by server status', async () => {
  const source = await readFrontend('src/routes/OnboardingGuard.jsx');
  assert.match(source, /onboardingApi\.status/);
  assert.match(source, /queryKeys\.onboardingStatus/);
  assert.match(source, /data\?\.nextPath/);
});

test('quiz submission refreshes dashboard and roadmap state', async () => {
  const source = await readFrontend('src/queries/quizQueries.js');
  assert.match(source, /queryKeys\.dashboard/);
  assert.match(source, /queryKeys\.roadmap/);
  assert.match(source, /invalidateMany/);
});

test('fallback review states stay scoreless and progress-neutral', async () => {
  const [projectSource, interviewSource] = await Promise.all([
    readFrontend('src/components/project/ProjectSubmissionFeedback.jsx'),
    readFrontend('src/components/interview/InterviewAttemptFeedback.jsx')
  ]);
  assert.match(projectSource, /has no score/);
  assert.match(projectSource, /!fallback\s*&&\s*feedback\.weakTopicsDetected/);
  assert.match(interviewSource, /REVIEW_MODE\.FALLBACK/);
  assert.match(interviewSource, /aiReviewed\s*&&\s*typeof attempt\.score === 'number'/);
});

test('interview expected answers and review retries stay attempt-gated', async () => {
  const [apiSource, pageSource] = await Promise.all([
    readFrontend('src/api/interviewApi.js'),
    readFrontend('src/pages/learner/InterviewPage.jsx')
  ]);
  assert.match(apiSource, /attempts\/\$\{attemptId\}\/review/);
  assert.match(pageSource, /selectedAttempts\.length\s*\?/);
});

test('admin publishing uses the shared confirmed lifecycle', async () => {
  const [routes, lessons, questions, templates] = await Promise.all([
    readRepo('backend/src/routes/admin.routes.js'),
    readFrontend('src/pages/admin/LessonsPage.jsx'),
    readFrontend('src/pages/admin/QuestionsPage.jsx'),
    readFrontend('src/pages/admin/TemplatesPage.jsx')
  ]);
  assert.doesNotMatch(routes, /admiinWriteLimiter/);
  assert.match(routes, /questions\/:id\/status', adminWriteLimiter/);
  for (const source of [lessons, questions, templates]) {
    assert.doesNotMatch(source, /window\.confirm/);
    assert.match(source, /ConfirmDialog/);
    assert.match(source, /confirmPublish:\s*true/);
  }
});

test('frontend enum values match backend API contracts', async () => {
  assert.deepEqual(Object.values(CONTENT_STATUS), ['draft', 'published', 'archived']);
  assert.deepEqual(Object.values(REVIEW_STATUS), ['submitted', 'reviewing', 'reviewed', 'review_unavailable']);
  assert.deepEqual(Object.values(REVIEW_MODE), ['ai', 'fallback', 'none']);
  assert.deepEqual(Object.values(JOB_STATUS), ['queued', 'processing', 'completed', 'failed']);
  assert.deepEqual(Object.values(REVISION_STATUS), ['pending', 'completed', 'skipped']);
  assert.deepEqual(Object.values(SEVERITY), ['low', 'medium', 'high', 'critical']);
  assert.deepEqual(Object.values(ROADMAP_TYPE), ['template', 'template_ai_adjusted', 'assessment_ai_personalized']);
  assert.deepEqual(Object.values(COURSE_STATUS), ['generating', 'active', 'failed', 'archived']);
  assert.deepEqual(Object.values(LEARNING_ITEM_STATUS), ['locked', 'available', 'in_progress', 'completed']);
  assert.deepEqual(Object.values(ASSESSMENT_STATUS), ['not_required', 'skipped', 'completed']);
  assert.equal(Object.values(ONBOARDING_STATE).length, 10);

  const sources = await Promise.all([
    readRepo('backend/src/models/ProjectSubmission.js'),
    readRepo('backend/src/models/InterviewAttempt.js'),
    readRepo('backend/src/models/AIJob.js'),
    readRepo('backend/src/models/RevisionItem.js'),
    readRepo('backend/src/models/CoursePlan.js'),
    readRepo('backend/src/constants/onboardingStates.js'),
    readRepo('backend/src/constants/roadmapTypes.js'),
    readRepo('backend/src/services/adminContent/common.js')
  ]);
  const combined = sources.join('\n');
  const frontendValues = [
    ...Object.values(CONTENT_STATUS),
    ...Object.values(COURSE_STATUS),
    ...Object.values(LEARNING_ITEM_STATUS),
    ...Object.values(REVIEW_STATUS),
    ...Object.values(REVIEW_MODE),
    ...Object.values(JOB_STATUS),
    ...Object.values(REVISION_STATUS),
    ...Object.values(SEVERITY),
    ...Object.values(ROADMAP_TYPE),
    ...Object.values(ONBOARDING_STATE)
  ];
  for (const value of frontendValues) assert.match(combined, new RegExp(`[\"']${value}[\"']`));
});

test('status presentation covers valid non-terminal API states', () => {
  assert.equal(getStatusTone('available'), 'info');
  assert.equal(getStatusTone('in_progress'), 'warning');
  assert.equal(getStatusTone('generating'), 'info');
  assert.equal(getStatusTone('review_unavailable'), 'warning');
  assert.equal(getStatusTone('not_required'), 'neutral');
  assert.equal(formatDomainLabel('assessment_ai_personalized'), 'assessment ai personalized');
});

test('legacy frontend exports and unused API wrappers stay removed', async () => {
  const [onboarding, authSchema, keys, projectQueries, projectApiSource, adminApiSource] = await Promise.all([
    readFrontend('src/constants/onboardingSteps.js'),
    readFrontend('src/validations/auth.schema.js'),
    readFrontend('src/constants/queryKeys.js'),
    readFrontend('src/queries/projectQueries.js'),
    readFrontend('src/api/projectApi.js'),
    readFrontend('src/api/adminApi.js')
  ]);
  assert.doesNotMatch(onboarding, /accountJourneySteps/);
  assert.doesNotMatch(authSchema, /verifyEmailFormSchema/);
  assert.doesNotMatch(keys, /auth:\s*\['auth'\]|projectSubmissions/);
  assert.doesNotMatch(projectQueries, /useProjectSubmissions|queryKeys\.projectSubmissions/);
  assert.doesNotMatch(projectApiSource, /^\s*submissions:/m);
  assert.doesNotMatch(adminApiSource, /^\s*lesson:|^\s*interviewQuestion:/m);
  assert.match(projectQueries, /\['project-tasks'\]/);
});
