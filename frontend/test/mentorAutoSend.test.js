import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readFrontend = (path) => readFile(resolve(frontendRoot, path), 'utf8');

test('lesson mentor auto-send handoff is consumed before a browser refresh can resend it', async () => {
  const [queries, mentorPage, lessonPage] = await Promise.all([
    readFrontend('src/queries/mentorQueries.js'),
    readFrontend('src/pages/learner/MentorPage.jsx'),
    readFrontend('src/pages/learner/LessonPage.jsx')
  ]);

  assert.match(lessonPage, /autoSend=true/);
  assert.match(mentorPage, /params\.get\(["']autoSend["']\)\s*===\s*["']true["']/);
  assert.match(queries, /consumeMentorAutoSendUrl/);
  assert.match(queries, /params\.delete\(["']autoSend["']\)/);
  assert.match(queries, /params\.delete\(["']promptType["']\)/);
  assert.match(queries, /params\.get\(["']lessonId["']\)/);
  assert.match(queries, /window\.history\.replaceState\(window\.history\.state/);
  assert.doesNotMatch(queries, /params\.delete\(["']lessonId["']\)/);
});
