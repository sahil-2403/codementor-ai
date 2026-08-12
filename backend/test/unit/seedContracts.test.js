import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('development seed expects a fresh database and runs directly', () => {
  const packageJson = JSON.parse(read('../../package.json'));
  const seed = read('../../src/seed/seed.js');

  assert.equal(packageJson.scripts.seed, 'node src/seed/seed.js');
  assert.match(seed, /ensureFreshDatabase/);
  assert.match(seed, /Seed expects a fresh development database/);
  assert.doesNotMatch(seed, /syncIndexes|dropIndex|migration/i);
});
