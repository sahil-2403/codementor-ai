import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readFrontend = (path) => readFile(resolve(frontendRoot, path), 'utf8');

test('lesson mentor auto-send is claimed once before sending and cannot replay on refresh', async () => {
  const [queries, mentorPage, lessonPage, main] = await Promise.all([
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

  // Mentor query hooks fetch data only; route-state consumption belongs to MentorPage.
  assert.doesNotMatch(queries, /consumeMentorAutoSendUrl|history\.replaceState|URLSearchParams/);

  // lessonId stays in cleanParams, preserving the current learning context.
  assert.doesNotMatch(mentorPage, /cleanParams\.delete\(["']lessonId["']\)/);
});

test('mentor quota refresh does not keep the send mutation pending after the answer arrives', async () => {
  const queries = await readFrontend('src/queries/mentorQueries.js');

  assert.match(queries, /onSettled:\s*\(\)\s*=>\s*\{/);
  assert.match(queries, /void queryClient\.invalidateQueries\(\{ queryKey: queryKeys\.mentorAIStatus \}\)/);
  assert.doesNotMatch(
    queries,
    /onSettled:\s*\(\)\s*=>\s*queryClient\.invalidateQueries\(\{ queryKey: queryKeys\.mentorAIStatus \}\)/
  );
});
