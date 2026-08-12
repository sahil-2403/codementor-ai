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
  assert.match(integrity, /enrollment:\s*enrollment\._id/);
  assert.match(onboarding, /get\('\/enrollments'/);
  assert.match(onboarding, /post\('\/enrollments\/:enrollmentId\/current'/);
});

test('projects and interview practice stay inside the current course', () => {
  const projects = source('services/project.service.js');
  const interview = source('services/interview.service.js');

  assert.match(projects, /course:\s*course\.course/);
  assert.match(projects, /belongs to a different course/);
  assert.match(interview, /course:\s*course\.course/);
  assert.match(interview, /belongs to a different course/);
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

  assert.match(controller, /repairExistingRoadmap/);
  assert.match(controller, /createProgressForCourse/);
  assert.match(roadmap, /const finalReason = aiGenerated \|\| roadmapType === ROADMAP_TYPES\.TEMPLATE/);
  assert.match(roadmap, /: 'initial_template'/);
});

test('admin course archive blocks active learner roadmaps and catalog levels stay compatible', () => {
  const lifecycle = source('services/adminContent/dependencyLifecycle.service.js');
  const catalog = source('services/adminContent/catalog.service.js');

  assert.match(lifecycle, /activeLearnerPlans/);
  assert.match(lifecycle, /active learner roadmap/);
  assert.match(catalog, /assertCourseFitsPublishedPaths/);
  assert.match(catalog, /supports only one parent level|Choose a top-level technology as the parent/);
});
