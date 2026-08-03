import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertModuleBelongsToCourse,
  assertModuleUnlocked,
  assertQuestionsBelongToModule
} from '../../src/domain/quizPolicy.js';

test('locked quiz modules fail authorization with QUIZ_LOCKED', () => {
  const course = { modules: [{ _id: 'module-1', status: 'locked', quizQuestions: [] }] };
  const module = assertModuleBelongsToCourse({ course, moduleId: 'module-1' });
  assert.throws(
    () => assertModuleUnlocked(module),
    (error) => error.statusCode === 403 && error.code === 'QUIZ_LOCKED'
  );
});

test('quiz answers cannot include a question from another module', () => {
  const module = { quizQuestions: [{ _id: 'q1' }, { _id: 'q2' }] };
  assert.throws(
    () => assertQuestionsBelongToModule({ module, questionIds: ['q1', 'foreign'], requireExactSet: true }),
    (error) => error.statusCode === 403
  );
});

test('quiz answers must include every module question exactly once', () => {
  const module = { quizQuestions: [{ _id: 'q1' }, { _id: 'q2' }] };
  assert.equal(assertQuestionsBelongToModule({ module, questionIds: ['q2', 'q1'], requireExactSet: true }), true);
  assert.throws(
    () => assertQuestionsBelongToModule({ module, questionIds: ['q1'], requireExactSet: true }),
    (error) => error.statusCode === 400
  );
  assert.throws(
    () => assertQuestionsBelongToModule({ module, questionIds: ['q1', 'q1'], requireExactSet: true }),
    (error) => error.statusCode === 400
  );
});
