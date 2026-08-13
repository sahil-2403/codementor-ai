import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readFrontend = (path) => readFile(resolve(frontendRoot, path), 'utf8');

test('onboarding guard waits for status from the current route before redirecting', async () => {
  const source = await readFrontend('src/routes/OnboardingGuard.jsx');
  const currentRouteWait = source.indexOf("checkedPath !== location.pathname");
  const catalogRedirect = source.indexOf('ONBOARDING_STATE.CATALOG_PENDING');
  const courseRedirect = source.indexOf("mode === 'needs-course'");

  assert.ok(currentRouteWait >= 0, 'guard should wait when the route changed after the last status check');
  assert.ok(catalogRedirect > currentRouteWait, 'catalog redirect must use status loaded for the current route');
  assert.ok(courseRedirect > currentRouteWait, 'course redirect must use status loaded for the current route');
  assert.match(source, /setCheckedPath\(location\.pathname\)/);
  assert.match(source, /location\.pathname, loadAttempt/);
  assert.match(source, /Could not check your learning setup/);
});

test('dashboard skill-check banner trusts the backend eligibility flag', async () => {
  const source = await readFrontend('src/pages/learner/DashboardPage.jsx');

  assert.match(source, /const canPersonalize = Boolean\(stats\.canPersonalizeLater\);/);
  assert.doesNotMatch(source, /generatedReason\s*!==\s*['"]assessment_personalized['"]/);
});
