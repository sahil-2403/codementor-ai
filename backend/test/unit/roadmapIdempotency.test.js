import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoadmapIdempotencyKey } from '../../src/domain/roadmapIdempotency.js';

test('roadmap idempotency keys are stable for equivalent generation inputs', () => {
  const first = createRoadmapIdempotencyKey({
    learningGoalId: 'goal-1',
    assessmentId: 'assessment-1',
    roadmapType: 'assessment_ai_personalized',
    generatedReason: 'assessment_personalized'
  });
  const second = createRoadmapIdempotencyKey({
    generatedReason: 'assessment_personalized',
    roadmapType: 'assessment_ai_personalized',
    assessmentId: 'assessment-1',
    learningGoalId: 'goal-1'
  });
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test('roadmap idempotency keys change when meaningful inputs change', () => {
  const first = createRoadmapIdempotencyKey({ learningGoalId: 'goal-1', roadmapType: 'template' });
  const second = createRoadmapIdempotencyKey({ learningGoalId: 'goal-2', roadmapType: 'template' });
  assert.notEqual(first, second);
});
