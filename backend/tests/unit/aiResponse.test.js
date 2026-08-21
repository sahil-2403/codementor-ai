import { parseAIJson, validateAIResponse } from '../../src/domain/aiResponse.js';

describe('AI response helpers', () => {
  test('parses plain, fenced, and surrounded JSON', () => {
    expect(parseAIJson('{"ok":true}')).toEqual({ ok: true });
    expect(parseAIJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
    expect(parseAIJson('Result: {"ok":true} done')).toEqual({ ok: true });
  });

  test('returns null for unusable provider output', () => {
    expect(parseAIJson('not json')).toBeNull();
    expect(parseAIJson('')).toBeNull();
  });

  test('returns normalized schema data and rejects invalid output', () => {
    const validSchema = { safeParse: () => ({ success: true, data: { score: 90 } }) };
    expect(validateAIResponse(validSchema, { score: '90' })).toEqual({ score: 90 });

    const issues = [{ path: ['score'], message: 'Must be at most 100' }];
    const invalidSchema = { safeParse: () => ({ success: false, error: { issues } }) };
    expect(() => validateAIResponse(invalidSchema, { score: 140 })).toThrow();
  });
});
