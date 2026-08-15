import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('learner requests resolve one explicit current enrollment', () => {
  const user = source('models/User.js');
  const integrity = source('services/dataIntegrity.service.js');
  const onboarding = source('routes/onboarding.routes.js');

  assert.match(user, /currentEnrollment/);
  assert.match(integrity, /getCurrentEnrollmentForUser/);
  assert.match(integrity, /status: 'active'/);
  assert.match(integrity, /status: 'completed'/);
  assert.match(integrity, /enrollment:\s*enrollment\._id/);
  assert.match(onboarding, /get\('\/enrollments'/);
  assert.match(onboarding, /post\('\/enrollments\/:enrollmentId\/current'/);
});

test('onboarding moves from level directly to assessment choice or roadmap', () => {
  const onboarding = source('services/onboarding.service.js');
  const routes = source('routes/onboarding.routes.js');
  const model = source('models/Enrollment.js');
  const prompt = source('ai/promptBuilders.js');

  assert.match(onboarding, /level === 'beginner'[\s\S]*ONBOARDING_STATES\.ROADMAP_PENDING[\s\S]*ONBOARDING_STATES\.ASSESSMENT_CHOICE_PENDING/);
  assert.doesNotMatch(routes, /\/preferences/);
  assert.doesNotMatch(model, /dailyStudyTime|targetDurationDays|learningStyle|knownBasics|mainFocus|preferencesCompletedAt/);
  assert.doesNotMatch(prompt, /dailyStudyTime|targetDurationDays|learningStyle|knownBasics|mainFocus/);
});

test('practice interview quizzes and revisions stay inside the current course', () => {
  const practice = source('services/practice.service.js');
  const interview = source('services/interview.service.js');
  const quiz = source('services/quiz.service.js');
  const revision = source('services/revision.service.js');

  assert.match(practice, /course:\s*course\.course/);
  assert.match(practice, /belongs to a different course/);
  assert.match(interview, /course:\s*course\.course/);
  assert.match(interview, /belongs to a different course/);
  assert.match(quiz, /coursePlan:\s*course\._id/);
  assert.match(revision, /coursePlan:\s*course\._id/);
});

test('learning path completion advances with simple sequential enrollment updates', () => {
  const progress = source('services/progress.service.js');

  assert.match(progress, /advanceLearningPathIfNeeded/);
  assert.match(progress, /enrollment\.currentCourse = nextEntry\.course/);
  assert.match(progress, /enrollment\.onboardingState = ONBOARDING_STATES\.ROADMAP_PENDING/);
  assert.match(progress, /nextPath: '\/onboarding\/generating'/);
});

test('roadmap retry repairs progress and fallback is not labelled personalized', () => {
  const controller = source('controllers/roadmap.controller.js');
  const roadmap = source('services/roadmap.service.js');
  const dashboard = source('controllers/progress.controller.js');

  assert.match(controller, /repairExistingRoadmap/);
  assert.match(controller, /createProgressForCourse/);
  assert.match(controller, /roadmapType:\s*ROADMAP_TYPES\.TEMPLATE/);
  assert.match(roadmap, /const finalReason = aiGenerated \|\| roadmapType === ROADMAP_TYPES\.TEMPLATE/);
  assert.match(roadmap, /: 'initial_template'/);
  assert.match(dashboard, /assessmentPreference === 'take'/);
  assert.match(dashboard, /canPersonalizeLater/);
});

test('skipping an unfinished assessment moves setup to roadmap generation', () => {
  const onboarding = source('services/onboarding.service.js');
  const roadmapPending = onboarding.indexOf('enrollment.onboardingState === ONBOARDING_STATES.ROADMAP_PENDING');
  const startedAssessment = onboarding.indexOf("assessment?.status === 'started'");

  assert.ok(roadmapPending >= 0, 'roadmap_pending should be handled explicitly');
  assert.ok(startedAssessment > roadmapPending, 'explicit roadmap_pending choice must win over an older started assessment');
  assert.match(onboarding, /markAssessmentSkipped[\s\S]*assessmentPreference = enrollment\.level === 'beginner' \? 'not_applicable' : 'skip'/);
  assert.match(onboarding, /markAssessmentSkipped[\s\S]*onboardingState = ONBOARDING_STATES\.ROADMAP_PENDING/);
});

test('admin lifecycle protects active learners and simple catalog rules', () => {
  const lifecycle = source('services/adminContent/dependencyLifecycle.service.js');
  const catalog = source('services/adminContent/catalog.service.js');
  const questions = source('services/adminContent/question.service.js');

  assert.match(lifecycle, /activeLearnerPlans/);
  assert.match(lifecycle, /active learner roadmap/);
  assert.match(lifecycle, /A technology with child technologies must stay top-level/);
  assert.match(catalog, /assertCourseFitsPublishedPaths/);
  assert.match(catalog, /Choose a top-level technology as the parent/);
  assert.match(questions, /assertQuestionNotInActiveRoadmap/);
  assert.match(questions, /used by an active learner roadmap/);
});
