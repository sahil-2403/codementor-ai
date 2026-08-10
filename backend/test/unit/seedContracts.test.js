import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('development seed reconciles stale parallel-array indexes before inserting', () => {
  const packageJson = JSON.parse(read('../../package.json'));
  const runner = read('../../src/seed/runSeed.js');

  assert.equal(packageJson.scripts.seed, 'node src/seed/runSeed.js');
  assert.match(runner, /QuizQuestion\.syncIndexes\(\)/);
  assert.match(runner, /ProjectTask\.syncIndexes\(\)/);
  assert.match(runner, /await import\('\.\/seed\.js'\)/);
});
