import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readFrontend = (path) => readFile(resolve(frontendRoot, path), 'utf8');

test('admin dashboard loads the dedicated content overview directly', async () => {
  const [page, api] = await Promise.all([
    readFrontend('src/pages/admin/AdminDashboardPage.jsx'),
    readFrontend('src/api/adminApi.js')
  ]);

  assert.match(api, /contentOverview:\s*\(\)\s*=>\s*api\.get\('\/admin\/content-overview'\)/);
  assert.match(page, /adminApi\.contentOverview\(\)/);
  assert.match(page, /useEffect/);
  assert.match(page, /useState/);
  assert.doesNotMatch(page, /queries\/|useAsyncData|useAsyncAction/);
  assert.doesNotMatch(page, /adminApi\.topics\(|adminApi\.lessons\(|adminApi\.questions\(|adminApi\.templates\(/);
});

test('admin dashboard exposes catalog inventory, curriculum, attention, coverage, actions, and recent content', async () => {
  const page = await readFrontend('src/pages/admin/AdminDashboardPage.jsx');

  assert.match(page, /What learners can choose/);
  assert.match(page, /Course-owned learning content/);
  assert.match(page, /Needs attention/);
  assert.match(page, /Build top to bottom/);
  assert.match(page, /Roadmap coverage/);
  assert.match(page, /Question banks/);
  assert.match(page, /Recently updated/);
  assert.match(page, /publishedLessonsWithoutQuizCoverage/);
  assert.doesNotMatch(page, /quality score|health score|\bXP\b|\bstreak\b/i);
});
