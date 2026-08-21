import { assertReviewCanStart, isReviewStale, REVIEW_STALE_MS } from '../../src/domain/reviewPolicy.js';
import { escapeRegex } from '../../src/utils/regex.js';
import { getUtcWeekStart } from '../../src/utils/week.js';

describe('reliability policies', () => {
  test('blocks active reviews and permits stale recovery', () => {
    const now = Date.UTC(2026, 7, 5, 10, 0, 0);
    expect(isReviewStale(new Date(now - REVIEW_STALE_MS + 1), now)).toBe(false);
    expect(isReviewStale(new Date(now - REVIEW_STALE_MS), now)).toBe(true);
    expect(() => assertReviewCanStart({ status: 'reviewing', reviewRequestedAt: new Date(now - 1000), label: 'Attempt', now })).toThrow();
    expect(() => assertReviewCanStart({ status: 'reviewing', reviewRequestedAt: new Date(now - REVIEW_STALE_MS), label: 'Attempt', now })).not.toThrow();
  });

  test('uses a stable UTC Monday boundary for weekly reports', () => {
    expect(getUtcWeekStart('2026-08-05T23:30:00+05:30').toISOString()).toBe('2026-08-03T00:00:00.000Z');
    expect(getUtcWeekStart('2026-08-10T00:00:00Z').toISOString()).toBe('2026-08-10T00:00:00.000Z');
  });

  test('escapes user search text before regex matching', () => {
    const escaped = escapeRegex('node.js (api)+');
    expect(escaped).toBe('node\\.js \\(api\\)\\+');
    const expression = new RegExp(escaped, 'i');
    expect(expression.test('Node.js (API)+')).toBe(true);
    expect(expression.test('NodeXjs API')).toBe(false);
  });
});
