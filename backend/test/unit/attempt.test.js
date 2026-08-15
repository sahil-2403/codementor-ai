import test from 'node:test';
import assert from 'node:assert/strict';
import { createAttempt } from '../../src/services/attempt.service.js';

test('first attempt is numbered one', async () => {
  const model = {
    countDocuments: async () => 0,
    create: async (payload) => payload
  };

  const result = await createAttempt({
    model,
    identityFilter: { user: 'u1', question: 'q1' },
    payload: { answer: 'Answer' },
    limitMessage: 'Attempt limit reached'
  });

  assert.equal(result.attemptNumber, 1);
});

test('second attempt is numbered two', async () => {
  const model = {
    countDocuments: async () => 1,
    create: async (payload) => payload
  };

  const result = await createAttempt({
    model,
    identityFilter: { user: 'u1', practiceTask: 'p1' },
    payload: { submittedCode: 'const value = 1;' },
    limitMessage: 'Attempt limit reached'
  });

  assert.equal(result.attemptNumber, 2);
});

test('third attempt is rejected', async () => {
  const model = {
    countDocuments: async () => 2,
    create: async () => null
  };

  await assert.rejects(
    () => createAttempt({ model, identityFilter: {}, payload: {}, limitMessage: 'Both attempts used' }),
    (error) => error.statusCode === 409 && error.code === 'ATTEMPT_LIMIT_REACHED'
  );
});
