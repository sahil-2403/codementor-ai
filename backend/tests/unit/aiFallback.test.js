import {
  interviewFeedbackFallback,
  mentorFallback,
  practiceReviewFallback
} from '../../src/services/aiFallback.service.js';

describe('AI fallbacks', () => {
  test('practice fallback is honest and unscored', () => {
    const result = practiceReviewFallback({ task: { evaluationChecklist: ['Validation', 'Error handling'] } });
    expect(result.score).toBeNull();
    expect(result.aiAvailable).toBe(false);
    expect(result.weakTopicsDetected).toEqual([]);
    expect(result.checklist.every((item) => item.passed === false)).toBe(true);
  });

  test('interview fallback does not invent strengths or scores', () => {
    const result = interviewFeedbackFallback({ question: { expectedAnswer: 'Use a closure.' } });
    expect(result.score).toBeNull();
    expect(result.strengths).toEqual([]);
    expect(result.weakTopicsDetected).toEqual([]);
    expect(result.expectedAnswer).toBe('Use a closure.');
  });

  test('mentor fallback reports unavailable AI instead of inventing an answer', () => {
    const result = mentorFallback({ lesson: { title: 'Closures' } });
    expect(result.answer).toBe('');
    expect(result.aiAvailable).toBe(false);
    expect(result.summary).toMatch(/unavailable/i);
  });
});
