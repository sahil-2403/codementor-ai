import test from 'node:test';
import assert from 'node:assert/strict';
import {
  interviewFeedbackFallback,
  mentorFallback,
  projectReviewFallback
} from '../../src/services/aiFallback.service.js';

test('project fallback is honest and unscored', () => {
  const result = projectReviewFallback({ task: { evaluationChecklist: ['Validation', 'Error handling'] } });
  assert.equal(result.score, null);
  assert.equal(result.aiAvailable, false);
  assert.deepEqual(result.weakTopicsDetected, []);
  assert.equal(result.checklist.every((item) => item.passed === false), true);
});

test('interview fallback does not invent strengths, score, or weak topics', () => {
  const result = interviewFeedbackFallback({ question: { expectedAnswer: 'Use a closure.' } });
  assert.equal(result.score, null);
  assert.deepEqual(result.strengths, []);
  assert.deepEqual(result.weakTopicsDetected, []);
  assert.equal(result.expectedAnswer, 'Use a closure.');
});

test('mentor fallback reports unavailable AI instead of fabricating an answer', () => {
  const result = mentorFallback({ lesson: { title: 'Closures' } });
  assert.equal(result.answer, '');
  assert.equal(result.aiAvailable, false);
  assert.match(result.summary, /unavailable/i);
});
