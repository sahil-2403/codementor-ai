import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { onboardingCopyByLevel, onboardingSteps } from '../src/constants/onboardingSteps.js';
import { queryKeys } from '../src/constants/queryKeys.js';
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
  assert.match(interviewSource, /feedbackMode === 'fallback'/);
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
