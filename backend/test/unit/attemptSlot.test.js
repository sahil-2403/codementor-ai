import test from 'node:test';
import assert from 'node:assert/strict';
import { createInAvailableAttemptSlot } from '../../src/services/attemptSlot.service.js';

const slotConflict = (attemptNumber) => Object.assign(new Error('duplicate slot'), {
  code: 11000,
  keyPattern: { attemptNumber: 1 },
  keyValue: { attemptNumber }
});

test('attempt allocation uses slot 1 first', async () => {
  const model = { exists: async () => false, create: async (payload) => payload };
  const result = await createInAvailableAttemptSlot({
    model,
    identityFilter: { user: 'u1', question: 'q1' },
    payload: { answer: 'Answer' },
    limitMessage: 'Attempt limit reached'
  });
  assert.equal(result.attemptNumber, 1);
});

test('attempt allocation retries slot 2 after a concurrent slot-1 conflict', async () => {
  const attempted = [];
  const model = {
    exists: async () => false,
    create: async (payload) => {
      attempted.push(payload.attemptNumber);
      if (payload.attemptNumber === 1) throw slotConflict(1);
      return payload;
    }
  };
  const result = await createInAvailableAttemptSlot({
    model,
    identityFilter: { user: 'u1', projectTask: 'p1' },
    payload: { submittedCode: 'const value = 1;' },
    limitMessage: 'Attempt limit reached'
  });
  assert.deepEqual(attempted, [1, 2]);
  assert.equal(result.attemptNumber, 2);
});

test('attempt allocation rejects a third project or interview attempt', async () => {
  const model = {
    exists: async () => false,
    create: async (payload) => { throw slotConflict(payload.attemptNumber); }
  };
  await assert.rejects(
    () => createInAvailableAttemptSlot({ model, identityFilter: {}, payload: {}, limitMessage: 'Both attempts used' }),
    (error) => error.statusCode === 409 && error.code === 'ATTEMPT_LIMIT_REACHED'
  );
});

test('attempt allocation blocks unmigrated legacy records', async () => {
  const model = { exists: async () => true, create: async () => null };
  await assert.rejects(
    () => createInAvailableAttemptSlot({ model, identityFilter: {}, payload: {}, limitMessage: 'Both attempts used' }),
    (error) => error.statusCode === 503 && error.code === 'ATTEMPT_MIGRATION_REQUIRED'
  );
});
