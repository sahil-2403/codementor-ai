import { AI_SAFETY, UNSUPPORTED_AI_PATTERNS } from '../constants/aiSafety.js';
import { ApiError } from '../utils/ApiError.js';

const CONTROL_CHARS_REGEX = new RegExp('[\\x00-\\x1F\\x7F]', 'g');
const stripControlChars = (value = '') => String(value).replace(CONTROL_CHARS_REGEX, ' ');
const collapseWhitespace = (value = '') => stripControlChars(value).replace(/\s+/g, ' ').trim();

export const sanitizeAIText = (value = '', maxChars = AI_SAFETY.MAX_MENTOR_PROMPT_CHARS) =>
  collapseWhitespace(value).slice(0, maxChars);

export const sanitizeCodeText = (value = '', maxChars = AI_SAFETY.MAX_PROJECT_CODE_CHARS) =>
  stripControlChars(value).trim().slice(0, maxChars);

export const guardAIRequest = async ({ text, maxChars = AI_SAFETY.MAX_MENTOR_PROMPT_CHARS, minChars = 2 }) => {
  const rawText = String(text || '');
  const cleaned = sanitizeAIText(rawText, maxChars);

  if (!cleaned || cleaned.length < minChars) {
    throw new ApiError(400, 'Please enter a meaningful request.');
  }
  if (rawText.length > maxChars) {
    throw new ApiError(400, `AI request is too long. Maximum allowed characters: ${maxChars}.`);
  }
  if (UNSUPPORTED_AI_PATTERNS.some((pattern) => pattern.test(cleaned))) {
    throw new ApiError(400, 'This AI request type is not supported in CodeMentor AI. Ask a learning-focused question instead.');
  }

  return { sanitizedText: cleaned };
};

export const trimContextForAI = (contextItems = [], maxChars = AI_SAFETY.MAX_CONTEXT_CHARS) => {
  let used = 0;
  return contextItems.map((item) => {
    const snippet = String(item.snippet || '').slice(0, Math.max(0, maxChars - used));
    used += snippet.length;
    return { ...item, snippet };
  }).filter((item) => item.snippet || item.source);
};
