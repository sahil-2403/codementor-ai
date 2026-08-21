import {
  assertModuleBelongsToCourse,
  assertModuleUnlocked,
  assertQuestionsBelongToModule
} from '../../src/domain/quizPolicy.js';

const captureError = (callback) => {
  try {
    callback();
    return null;
  } catch (error) {
    return error;
  }
};

describe('quiz policy', () => {
  test('blocks locked quiz modules', () => {
    const course = { modules: [{ _id: 'module-1', status: 'locked', quizQuestions: [] }] };
    const module = assertModuleBelongsToCourse({ course, moduleId: 'module-1' });
    const error = captureError(() => assertModuleUnlocked(module));

    expect(error).toMatchObject({ statusCode: 403, code: 'QUIZ_LOCKED' });
  });

  test('rejects questions from another module', () => {
    const module = { quizQuestions: [{ _id: 'q1' }, { _id: 'q2' }] };
    const error = captureError(() => assertQuestionsBelongToModule({
      module,
      questionIds: ['q1', 'foreign'],
      requireExactSet: true
    }));

    expect(error).toMatchObject({ statusCode: 403 });
  });

  test('requires every module question exactly once', () => {
    const module = { quizQuestions: [{ _id: 'q1' }, { _id: 'q2' }] };

    expect(assertQuestionsBelongToModule({ module, questionIds: ['q2', 'q1'], requireExactSet: true })).toBe(true);
    expect(() => assertQuestionsBelongToModule({ module, questionIds: ['q1'], requireExactSet: true })).toThrow();
    expect(() => assertQuestionsBelongToModule({ module, questionIds: ['q1', 'q1'], requireExactSet: true })).toThrow();
  });
});
