import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { onboardingCopyByLevel, onboardingSteps } from '../src/constants/onboardingSteps.js';
import {
  ASSESSMENT_STATUS,
  CONTENT_STATUS,
  COURSE_STATUS,
  formatDomainLabel,
  getStatusTone,
  LEARNING_ITEM_STATUS,
  ONBOARDING_STATE,
  REVIEW_MODE,
  REVIEW_STATUS,
  REVISION_STATUS,
  ROADMAP_TYPE,
  SEVERITY
} from '../src/constants/domainEnums.js';
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

test('onboarding copy preserves catalog and optional-diagnostic paths', () => {
  assert.deepEqual(onboardingSteps.map((step) => step.key), ['catalog', 'level', 'setup', 'roadmap']);
  assert.equal(onboardingCopyByLevel.beginner.badge, 'No assessment required');
  assert.match(onboardingCopyByLevel.intermediate.badge, /optional/i);
  assert.match(onboardingCopyByLevel.advanced.badge, /optional/i);
});

test('frontend data flow uses plain react hooks and axios domain APIs', async () => {
  const [main, dataHook, actionHook, dashboardData, adminData] = await Promise.all([
    readFrontend('src/main.jsx'),
    readFrontend('src/hooks/useAsyncData.js'),
    readFrontend('src/hooks/useAsyncAction.js'),
    readFrontend('src/queries/dashboardQueries.js'),
    readFrontend('src/queries/adminQueries.js')
  ]);

  assert.match(main, /DataRefreshProvider/);
  assert.match(dataHook, /useEffect/);
  assert.match(dataHook, /useState/);
  assert.match(actionHook, /refreshData\(\)/);
  assert.match(dashboardData, /useAsyncData\(progressApi\.dashboard\)/);
  assert.match(adminData, /useAsyncData/);
  assert.match(adminData, /useAsyncAction/);
});

test('auth transport keeps cookie, CSRF, refresh, and deployment contracts', async () => {
  const [source, authContext] = await Promise.all([
    readFrontend('src/api/axiosInstance.js'),
    readFrontend('src/context/AuthContext.jsx')
  ]);
  assert.match(source, /withCredentials:\s*true/);
  assert.match(source, /X-CSRF-Token/);
  assert.match(source, /auth\/refresh-token/);
  assert.match(source, /_retry/);
  assert.match(source, /VITE_API_BASE_URL\s*\|\|\s*['"]\/api['"]/);
  assert.doesNotMatch(source, /localhost:5000/);
  assert.match(source, /dispatchEvent\(new Event\(SESSION_EXPIRED_EVENT\)\)/);
  assert.match(authContext, /addEventListener\(SESSION_EXPIRED_EVENT/);
  assert.match(authContext, /finally\s*\{\s*setUser\(null\)/);
});

test('password recovery uses a generic non-enumerating success message', async () => {
  const source = await readFrontend('src/pages/public/ForgotPasswordPage.jsx');
  assert.match(source, /If\b[^'\"]*\baccount exists\b[^'\"]*\bpassword reset link\b/i);
  assert.match(source, /same whether or not an account exists/i);
  assert.doesNotMatch(source, /(?:we found|we confirmed)\s+(?:an?\s+)?account|email is registered/i);
});

test('onboarding navigation is driven by server status', async () => {
  const source = await readFrontend('src/routes/OnboardingGuard.jsx');
  assert.match(source, /onboardingApi\.status/);
  assert.match(source, /useAsyncData/);
  assert.match(source, /data\?\.nextPath/);
});

test('successful learner writes refresh mounted server data', async () => {
  const [quizData, actionHook] = await Promise.all([
    readFrontend('src/queries/quizQueries.js'),
    readFrontend('src/hooks/useAsyncAction.js')
  ]);
  assert.match(quizData, /useSubmitQuiz = \(\) => useAsyncAction\(quizApi\.submit\)/);
  assert.match(actionHook, /if \(refresh\) refreshData\(\)/);
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
    readFrontend('src/pages/admin/CourseLessonsPage.jsx'),
    readFrontend('src/pages/admin/CourseQuestionBankPage.jsx'),
    readFrontend('src/pages/admin/TemplatesPage.jsx')
  ]);
  assert.doesNotMatch(routes, /admiinWriteLimiter/);
  assert.match(routes, /lessons\/:id\/status', adminWriteLimiter/);
  assert.match(routes, /questions\/:id\/status', adminWriteLimiter/);
  assert.match(routes, /templates\/:id\/status', adminWriteLimiter/);

  for (const source of [lessons, questions, templates]) {
    assert.doesNotMatch(source, /window\.confirm/);
    assert.match(source, /ConfirmDialog/);
  }

  for (const source of [lessons, questions]) {
    assert.match(source, /confirmPublish:\s*statusTarget\.status\s*===\s*['"]published['"]/);
  }
  assert.match(templates, /status:\s*['"]published['"][\s\S]*confirmPublish:\s*true/);
});

test('admin routes use course-aware catalog and curriculum pages', async () => {
  const routes = await readFrontend('src/routes/AppRoutes.jsx');
  for (const path of [
    '/admin/catalog',
    '/admin/technologies/new',
    '/admin/courses/new',
    '/admin/courses/:courseId/workspace',
    '/admin/learning-paths/new',
    '/admin/project-tasks',
    '/admin/templates/new'
  ]) assert.match(routes, new RegExp(path.replace(/[/:]/g, (token) => token === '/' ? '\\/' : token)));
  assert.match(routes, /CourseTopicsPage/);
  assert.match(routes, /CourseLessonEditorPage/);
  assert.match(routes, /CourseQuestionEditorPage/);
  assert.match(routes, /CourseInterviewQuestionEditorPage/);
});

test('admin form schemas are course-first and no longer goal-key based', async () => {
  const schema = await readFrontend('src/validations/admin.schema.js');
  assert.match(schema, /technologyFormSchema/);
  assert.match(schema, /courseFormSchema/);
  assert.match(schema, /learningPathFormSchema/);
  assert.match(schema, /topicFormSchema/);
  assert.match(schema, /course:\s*objectId/);
  assert.match(schema, /lessons:\s*z\.array\(objectId\)/);
  assert.doesNotMatch(schema, /goalKey|lessonSlugs/);
});

test('roadmap template admin uses a structured editor and explicit deletion', async () => {
  const [routes, form, page, api] = await Promise.all([
    readFrontend('src/routes/AppRoutes.jsx'),
    readFrontend('src/components/admin/TemplateForm.jsx'),
    readFrontend('src/pages/admin/TemplatesPage.jsx'),
    readFrontend('src/api/adminApi.js')
  ]);
  assert.match(routes, /\/admin\/templates\/new/);
  assert.match(routes, /\/admin\/templates\/:templateId\/edit/);
  assert.match(form, /useFieldArray/);
  assert.doesNotMatch(form, /modulesText|Modules JSON|JSON\.parse|JSON\.stringify/);
  assert.match(page, /Type DELETE to confirm/);
  assert.match(page, /Restore to Draft/);
  assert.doesNotMatch(page, /Duplicate/);
  assert.match(api, /deleteTemplate/);
  assert.doesNotMatch(api, /duplicateTemplate|archiveTemplate/);
});

test('frontend enum values match current backend contracts', async () => {
  assert.deepEqual(Object.values(CONTENT_STATUS), ['draft', 'published', 'archived']);
  assert.deepEqual(Object.values(REVIEW_STATUS), ['submitted', 'reviewing', 'reviewed', 'review_unavailable']);
  assert.deepEqual(Object.values(REVIEW_MODE), ['ai', 'fallback', 'none']);
  assert.deepEqual(Object.values(REVISION_STATUS), ['pending', 'completed', 'skipped']);
  assert.deepEqual(Object.values(SEVERITY), ['low', 'medium', 'high', 'critical']);
  assert.deepEqual(Object.values(ROADMAP_TYPE), ['template', 'template_ai_adjusted', 'assessment_ai_personalized']);
  assert.deepEqual(Object.values(COURSE_STATUS), ['active', 'archived']);
  assert.deepEqual(Object.values(LEARNING_ITEM_STATUS), ['locked', 'available', 'in_progress', 'completed']);
  assert.deepEqual(Object.values(ASSESSMENT_STATUS), ['not_required', 'skipped', 'completed']);
  assert.equal(Object.values(ONBOARDING_STATE).length, 9);

  const sources = await Promise.all([
    readRepo('backend/src/models/ProjectSubmission.js'),
    readRepo('backend/src/models/InterviewAttempt.js'),
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
  assert.equal(getStatusTone('review_unavailable'), 'warning');
  assert.equal(getStatusTone('not_required'), 'neutral');
  assert.equal(formatDomainLabel('assessment_ai_personalized'), 'assessment ai personalized');
});

test('frontend has render recovery, lazy routes, and a real not-found page', async () => {
  const [main, boundary, routes, notFound] = await Promise.all([
    readFrontend('src/main.jsx'),
    readFrontend('src/components/common/AppErrorBoundary.jsx'),
    readFrontend('src/routes/AppRoutes.jsx'),
    readFrontend('src/pages/NotFoundPage.jsx')
  ]);
  assert.match(main, /<AppErrorBoundary>/);
  assert.match(boundary, /getDerivedStateFromError/);
  assert.match(boundary, /window\.location\.reload/);
  assert.match(routes, /lazy\(\(\) => import/);
  assert.match(routes, /<Suspense/);
  assert.match(routes, /path="\*" element=\{<NotFoundPage \/>\}/);
  assert.doesNotMatch(routes, /Navigate to="\/"/);
  assert.match(notFound, /Page not found/);
});

test('frontend API wrappers match active learner and admin flows', async () => {
  const [onboarding, authSchema, projectData, projectApiSource, adminApiSource, roadmapApiSource] = await Promise.all([
    readFrontend('src/constants/onboardingSteps.js'),
    readFrontend('src/validations/auth.schema.js'),
    readFrontend('src/queries/projectQueries.js'),
    readFrontend('src/api/projectApi.js'),
    readFrontend('src/api/adminApi.js'),
    readFrontend('src/api/roadmapApi.js')
  ]);
  assert.doesNotMatch(onboarding, /accountJourneySteps/);
  assert.doesNotMatch(authSchema, /verifyEmailFormSchema/);
  assert.doesNotMatch(projectData, /useProjectSubmissions/);
  assert.doesNotMatch(projectApiSource, /^\s*submissions:/m);
  assert.match(adminApiSource, /^\s*lesson:/m);
  assert.match(adminApiSource, /^\s*interviewQuestion:/m);
  assert.match(adminApiSource, /^\s*template:/m);
  assert.doesNotMatch(adminApiSource, /duplicateTemplate|archiveTemplate/);
  assert.match(projectData, /useAsyncData/);
  assert.match(roadmapApiSource, /generateOrGet/);
  assert.match(roadmapApiSource, /fromAssessment/);
});
