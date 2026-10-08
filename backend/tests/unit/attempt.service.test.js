import { createAttempt } from '../../src/services/attempt.service.js';

describe('createAttempt', () => {
  test('numbers the first and second attempts', async () => {
    const firstModel = {
      countDocuments: vi.fn().mockResolvedValue(0),
      create: vi.fn(async (payload) => payload)
    };
    const secondModel = {
      countDocuments: vi.fn().mockResolvedValue(1),
      create: vi.fn(async (payload) => payload)
    };

    await expect(createAttempt({
      model: firstModel,
      identityFilter: { user: 'u1', question: 'q1' },
      payload: { answer: 'Answer' },
      limitMessage: 'Attempt limit reached'
    })).resolves.toMatchObject({ attemptNumber: 1 });

    await expect(createAttempt({
      model: secondModel,
      identityFilter: { user: 'u1', practiceTask: 'p1' },
      payload: { submittedCode: 'const value = 1;' },
      limitMessage: 'Attempt limit reached'
    })).resolves.toMatchObject({ attemptNumber: 2 });
  });

  test('rejects a third attempt', async () => {
    const model = {
      countDocuments: vi.fn().mockResolvedValue(2),
      create: vi.fn()
    };

    await expect(createAttempt({
      model,
      identityFilter: {},
      payload: {},
      limitMessage: 'Both attempts used'
    })).rejects.toMatchObject({ statusCode: 409, code: 'ATTEMPT_LIMIT_REACHED' });

    expect(model.create).not.toHaveBeenCalled();
  });
});
