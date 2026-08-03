export const parseAIJson = (value = '') => {
  const text = String(value || '').trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }

  const objectMatch = text.match(/(\{[\s\S]*\})/);
  if (!objectMatch?.[1]) return null;

  try {
    return JSON.parse(objectMatch[1]);
  } catch {
    return null;
  }
};

export const validateAIResponse = (schema, value, message = 'Gemini response did not match the expected schema') => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const error = new Error(message);
    error.validationIssues = parsed.error.issues;
    throw error;
  }
  return parsed.data;
};
