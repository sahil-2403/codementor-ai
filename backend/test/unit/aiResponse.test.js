import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAIJson, validateAIResponse } from '../../src/domain/aiResponse.js';

test('Gemini JSON parser accepts plain, fenced, and surrounded JSON', () => {
  assert.deepEqual(parseAIJson('{"ok":true}'), { ok: true });
  assert.deepEqual(parseAIJson('```json\n{"ok":true}\n```'), { ok: true });
  assert.deepEqual(parseAIJson('Result: {"ok":true} done'), { ok: true });
});

test('Gemini JSON parser returns null for unusable provider output', () => {
  assert.equal(parseAIJson('not json'), null);
  assert.equal(parseAIJson(''), null);
});

test('AI response validation returns normalized schema data', () => {
  const schema = { safeParse: () => ({ success: true, data: { score: 90 } }) };
  assert.deepEqual(validateAIResponse(schema, { score: '90' }), { score: 90 });
});

test('AI response validation exposes schema issues without accepting invalid output', () => {
  const issues = [{ path: ['score'], message: 'Must be at most 100' }];
  const schema = { safeParse: () => ({ success: false, error: { issues } }) };
  assert.throws(
    () => validateAIResponse(schema, { score: 140 }),
    (error) => error.validationIssues === issues
  );
});
