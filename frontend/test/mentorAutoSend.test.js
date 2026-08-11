import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readFrontend = (path) => readFile(resolve(frontendRoot, path), 'utf8');

test('lesson mentor auto-send is claimed once before sending and cannot replay on refresh', async () => {
  const [mentorData, mentorPage, lessonPage, main] = await Promise.all([
    readFrontend('src/queries/mentorQueries.js'),
    readFrontend('src/pages/learner/MentorPage.jsx'),
    readFrontend('src/pages/learner/LessonPage.jsx'),
    readFrontend('src/main.jsx')
  ]);

  assert.match(main, /<React\.StrictMode>/);
  assert.match(lessonPage, /autoSend=true/);
  assert.match(mentorPage, /const \[params, setParams\] = useSearchParams\(\)/);
  assert.match(mentorPage, /const autoSentRef = useRef\(false\)/);
  assert.match(mentorPage, /autoSentRef\.current/);
  assert.match(mentorPage, /autoSentRef\.current = true/);
  assert.match(mentorPage, /cleanParams\.delete\(["']autoSend["']\)/);
  assert.match(mentorPage, /cleanParams\.delete\(["']promptType["']\)/);
  assert.match(mentorPage, /setParams\(cleanParams, \{ replace: true \}\)/);
  assert.match(mentorPage, /sendPayload\(\{ text: prompt\.text, type: prompt\.promptType \}\)/);
  assert.doesNotMatch(mentorPage, /setAutoSent/);

  assert.doesNotMatch(mentorData, /consumeMentorAutoSendUrl|history\.replaceState|URLSearchParams/);
  assert.doesNotMatch(mentorPage, /cleanParams\.delete\(["']lessonId["']\)/);
});

test('mentor pending state belongs only to the active request', async () => {
  const [mentorData, actionHook] = await Promise.all([
    readFrontend('src/queries/mentorQueries.js'),
    readFrontend('src/hooks/useAsyncAction.js')
  ]);

  assert.match(mentorData, /useAskMentor = \(\) => useAsyncAction\(mentorApi\.ask\)/);
  assert.match(actionHook, /setIsPending\(true\)/);
  assert.match(actionHook, /finally\s*\{[\s\S]*setIsPending\(false\)/);
  assert.match(actionHook, /if \(refresh\) refreshData\(\)/);
});
