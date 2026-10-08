import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const UNSUPPORTED_AI_PATTERNS = [
  /ignore previous instructions/i,
  /system prompt/i,
  /developer message/i,
  /jailbreak/i,
  /act as.*unrestricted/i
];

const CONTROL_CHARS_REGEX = new RegExp('[\\x00-\\x1F\\x7F]', 'g');
const stripControlChars = (value = '') => String(value).replace(CONTROL_CHARS_REGEX, ' ');
const collapseWhitespace = (value = '') => stripControlChars(value).replace(/\s+/g, ' ').trim();

export const sanitizeAIText = (value = '', maxChars = env.aiInputLimits.mentorPromptChars) =>
  collapseWhitespace(value).slice(0, maxChars);

export const sanitizeCodeText = (value = '', maxChars = env.aiInputLimits.practiceCodeChars) =>
  stripControlChars(value).trim().slice(0, maxChars);

export const guardAIRequest = async ({ text, maxChars = env.aiInputLimits.mentorPromptChars, minChars = 2 }) => {
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

export const trimContextForAI = (contextItems = [], maxChars = env.aiInputLimits.contextChars) => {
  let used = 0;
  return contextItems.map((item) => {
    const snippet = String(item.snippet || '').slice(0, Math.max(0, maxChars - used));
    used += snippet.length;
    return { ...item, snippet };
  }).filter((item) => item.snippet || item.source);
};
