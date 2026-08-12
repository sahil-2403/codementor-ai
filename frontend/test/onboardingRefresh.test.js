import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readFrontend = (path) => readFile(resolve(frontendRoot, path), 'utf8');

test('onboarding guard waits for status before redirecting a refreshed learner', async () => {
  const source = await readFrontend('src/routes/OnboardingGuard.jsx');
  const waitForStatus = source.indexOf('data === undefined && !error');
  const courseRedirect = source.indexOf("mode === 'needs-course'");

  assert.ok(waitForStatus >= 0, 'guard should wait until onboarding status is known');
  assert.ok(courseRedirect > waitForStatus, 'redirect checks must run after the initial status wait');
  assert.match(source, /Could not check your learning setup/);
  assert.match(source, /onAction=\{\(\) => refetch\(\)\}/);
});
