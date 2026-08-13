import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('profile exposes the current enrollment switch flow', () => {
  const api = read('../src/api/onboardingApi.js');
  const profile = read('../src/pages/learner/ProfilePage.jsx');
  const navbar = read('../src/components/navbar/TopNavbar.jsx');

  assert.match(api, /get\('\/onboarding\/enrollments'\)/);
  assert.match(api, /enrollments\/\$\{enrollmentId\}\/current/);
  assert.match(profile, /onboardingApi\.enrollments/);
  assert.match(profile, /onboardingApi\.switchEnrollment/);
  assert.match(profile, /navigate\('\/dashboard'\)/);
  assert.match(navbar, /\['Profile', '\/profile'\]/);
});

test('final lesson can continue a learning path through the server nextPath', () => {
  const lesson = read('../src/pages/learner/LessonPage.jsx');

  assert.match(lesson, /lessonApi\.complete\(lesson\._id\)/);
  assert.match(lesson, /if \(result\?\.nextPath\) navigate\(result\.nextPath\)/);
  assert.doesNotMatch(lesson, /mutateAsync|useAsyncAction|queries\//);
});
