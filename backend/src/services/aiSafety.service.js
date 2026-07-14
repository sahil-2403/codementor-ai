import { AIUsageLog } from '../models/AIUsageLog.js';
import { AI_SAFETY, UNSUPPORTED_AI_PATTERNS } from '../constants/aiSafety.js';
import { ApiError } from '../utils/ApiError.js';
import { createPromptFingerprint, logAIUsage } from './aiUsage.service.js';

const CONTROL_CHARS_REGEX = new RegExp('[\\x00-\\x1F\\x7F]', 'g');
const stripControlChars = (value = '') => String(value).replace(CONTROL_CHARS_REGEX, ' ');
const collapseWhitespace = (value = '') => stripControlChars(value).replace(/\s+/g, ' ').trim();

export const sanitizeAIText = (value = '', maxChars = AI_SAFETY.MAX_MENTOR_PROMPT_CHARS) => {
  const cleaned = collapseWhitespace(value);
  return cleaned.slice(0, maxChars);
};

export const sanitizeCodeText = (value = '', maxChars = AI_SAFETY.MAX_PROJECT_CODE_CHARS) => {
  const cleaned = stripControlChars(value).trim();
  return cleaned.slice(0, maxChars);
};

const includesUnsupportedPattern = (text = '') => UNSUPPORTED_AI_PATTERNS.some((pattern) => pattern.test(text));

export const guardAIRequest = async ({
  userId,
  feature,
  text,
  maxChars = AI_SAFETY.MAX_MENTOR_PROMPT_CHARS,
  minChars = 2,
  metadata = {}
}) => {
  const cleaned = sanitizeAIText(text, maxChars);
  const fingerprint = createPromptFingerprint(`${feature}:${cleaned.toLowerCase()}`);

  if (!cleaned || cleaned.length < minChars) {
    await logAIUsage({ user: userId, feature, status: 'blocked', model: process.env.AI_PROVIDER || 'mock', provider: process.env.AI_PROVIDER || 'mock', promptFingerprint: fingerprint, metadata: { ...metadata, reason: 'empty_or_too_short' } });
    throw new ApiError(400, 'Please enter a meaningful request.');
  }

  if (String(text || '').length > maxChars) {
    await logAIUsage({ user: userId, feature, status: 'blocked', model: process.env.AI_PROVIDER || 'mock', provider: process.env.AI_PROVIDER || 'mock', promptFingerprint: fingerprint, metadata: { ...metadata, reason: 'too_long', maxChars } });
    throw new ApiError(400, `AI request is too long. Maximum allowed characters: ${maxChars}.`);
  }

  if (includesUnsupportedPattern(cleaned)) {
    await logAIUsage({ user: userId, feature, status: 'blocked', model: process.env.AI_PROVIDER || 'mock', provider: process.env.AI_PROVIDER || 'mock', promptFingerprint: fingerprint, metadata: { ...metadata, reason: 'unsupported_prompt_pattern' } });
    throw new ApiError(400, 'This AI request type is not supported in CodeMentor AI. Ask a learning-focused question instead.');
  }

  const since = new Date(Date.now() - AI_SAFETY.REPEAT_WINDOW_MINUTES * 60 * 1000);
  const repeatedCount = await AIUsageLog.countDocuments({
    user: userId,
    feature,
    promptFingerprint: fingerprint,
    createdAt: { $gte: since },
    status: { $in: ['success', 'failed', 'blocked'] }
  });

  if (repeatedCount >= AI_SAFETY.REPEAT_LIMIT) {
    await logAIUsage({ user: userId, feature, status: 'blocked', model: process.env.AI_PROVIDER || 'mock', provider: process.env.AI_PROVIDER || 'mock', promptFingerprint: fingerprint, metadata: { ...metadata, reason: 'repeated_prompt', repeatedCount } });
    throw new ApiError(429, 'You have repeated the same AI request too many times. Try rephrasing it or revise the related lesson first.');
  }

  return { sanitizedText: cleaned, promptFingerprint: fingerprint };
};

export const trimContextForAI = (contextItems = [], maxChars = AI_SAFETY.MAX_CONTEXT_CHARS) => {
  let used = 0;
  return contextItems.map((item) => {
    const snippet = String(item.snippet || '').slice(0, Math.max(0, maxChars - used));
    used += snippet.length;
    return { ...item, snippet };
  }).filter((item) => item.snippet || item.source);
};
