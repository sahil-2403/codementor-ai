import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readFrontend = (path) => readFile(resolve(frontendRoot, path), 'utf8');

const lifecyclePages = [
  'src/pages/admin/TechnologiesPage.jsx',
  'src/pages/admin/CoursesPage.jsx',
  'src/pages/admin/LearningPathsPage.jsx',
  'src/pages/admin/CourseTopicsPage.jsx',
  'src/pages/admin/CourseLessonsPage.jsx',
  'src/pages/admin/CourseQuestionBankPage.jsx',
  'src/pages/admin/CourseInterviewQuestionsPage.jsx',
  'src/pages/admin/CourseProjectsPage.jsx',
  'src/pages/admin/TemplatesPage.jsx'
];

test('admin lifecycle pages expose permanent deletion only for archived items', async () => {
  for (const path of lifecyclePages) {
    const page = await readFrontend(path);
    assert.match(page, /const archived\s*=\s*[^;]*status\s*===\s*['"]archived['"]/);
    assert.match(page, /archived\s*\?\s*<Button[^>]*variant=['"]danger['"]/);
    assert.match(page, /Type DELETE to confirm/);
  }
});

test('blocked lifecycle actions use one clear how-to-resolve error presentation', async () => {
  const component = await readFrontend('src/components/admin/LifecycleError.jsx');
  assert.match(component, /How to resolve/);
  assert.match(component, /error\.errors/);
  assert.match(component, /error\.message/);

  for (const path of lifecyclePages) {
    const page = await readFrontend(path);
    assert.match(page, /LifecycleError/);
  }
});

test('course UI explains simple downward archive and restore behavior', async () => {
  const page = await readFrontend('src/pages/admin/CoursesPage.jsx');
  assert.match(page, /Archive this Course directly/);
  assert.match(page, /You do not need to archive its child curriculum first/);
  assert.match(page, /are archived automatically/);
  assert.match(page, /Learning Paths and prerequisite references are not changed/);
  assert.match(page, /Restore this Course to Draft/);
  assert.match(page, /Topics become Active/);
  assert.match(page, /Lessons, Questions, Projects, and Roadmap Templates become Draft/);
});
