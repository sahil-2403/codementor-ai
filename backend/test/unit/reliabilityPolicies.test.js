import test from 'node:test';
import assert from 'node:assert/strict';
import { assertReviewCanStart, isReviewStale, REVIEW_STALE_MS } from '../../src/domain/reviewPolicy.js';
import { escapeRegex } from '../../src/utils/regex.js';
import { getUtcWeekStart } from '../../src/utils/week.js';

test('review policy blocks active reviews and permits stale recovery', () => {
  const now = Date.UTC(2026, 7, 5, 10, 0, 0);
  assert.equal(isReviewStale(new Date(now - REVIEW_STALE_MS + 1), now), false);
  assert.equal(isReviewStale(new Date(now - REVIEW_STALE_MS), now), true);
  assert.throws(
    () => assertReviewCanStart({ status: 'reviewing', reviewRequestedAt: new Date(now - 1000), label: 'Attempt' }),
    (error) => error.code === 'REVIEW_IN_PROGRESS' && error.statusCode === 409
  );
  assert.doesNotThrow(() => assertReviewCanStart({ status: 'reviewing', reviewRequestedAt: new Date(now - REVIEW_STALE_MS), label: 'Attempt' }));
});

test('weekly reports use a stable UTC Monday boundary', () => {
  assert.equal(getUtcWeekStart('2026-08-05T23:30:00+05:30').toISOString(), '2026-08-03T00:00:00.000Z');
  assert.equal(getUtcWeekStart('2026-08-09T23:59:59Z').toISOString(), '2026-08-03T00:00:00.000Z');
  assert.equal(getUtcWeekStart('2026-08-10T00:00:00Z').toISOString(), '2026-08-10T00:00:00.000Z');
});

test('user search text is escaped before regular expression matching', () => {
  const escaped = escapeRegex('node.js (api)+');
  assert.equal(escaped, 'node\\.js \\(api\\)\\+');
  const expression = new RegExp(escaped, 'i');
  assert.equal(expression.test('Node.js (API)+'), true);
  assert.equal(expression.test('NodeXjs API'), false);
});
