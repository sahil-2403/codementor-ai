import { env } from '../config/env.js';
import { AI_ERROR_CODES, AIServiceError } from './aiErrors.js';
import { parseAIJson, validateAIResponse } from './aiSchemas.js';

const extractText = (data) =>
  data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text)
    .filter(Boolean)
    .join('\n') || '';

const mapProviderError = ({ response, data }) => {
  const providerMessage = data?.error?.message || 'Gemini request failed';

  if (response.status === 429) {
    return new AIServiceError(AI_ERROR_CODES.RATE_LIMITED, 'Gemini is temporarily rate limited.', {
      statusCode: 429,
      retryable: true
    });
  }

  if (response.status === 400 && /safety|blocked/i.test(providerMessage)) {
    return new AIServiceError(AI_ERROR_CODES.SAFETY_REJECTION, 'Gemini could not process this request safely.', {
      statusCode: 422,
      retryable: false
    });
  }

  return new AIServiceError(AI_ERROR_CODES.PROVIDER_ERROR, 'Gemini is temporarily unavailable.', {
    statusCode: 502,
    retryable: response.status >= 500
  });
};

export const createGeminiClient = ({
  apiKey = env.geminiApiKey,
  model = env.geminiModel,
  timeoutMs = env.aiTimeoutMs,
  fetchImpl = globalThis.fetch
} = {}) => {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A fetch implementation is required for the Gemini client');
  }

  const generate = async ({
    system,
    user,
    expectJson = false,
    schema,
    validationMessage,
    temperature = 0.3,
    maxTokens = 900
  }) => {
    if (!env.enableAi) {
      throw new AIServiceError(AI_ERROR_CODES.DISABLED, 'Gemini is disabled.', { retryable: false });
    }
    if (!apiKey) {
      throw new AIServiceError(AI_ERROR_CODES.NOT_CONFIGURED, 'Gemini is not configured.', { retryable: false });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: String(system || '') }] },
          contents: [{ role: 'user', parts: [{ text: String(user || '') }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            ...(expectJson ? { responseMimeType: 'application/json' } : {})
          }
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw mapProviderError({ response, data });

      const text = extractText(data);
      if (!text.trim()) {
        throw new AIServiceError(AI_ERROR_CODES.INVALID_RESPONSE, 'Gemini returned an empty response.', {
          retryable: false
        });
      }

      let parsed = null;
      let validated = null;
      if (expectJson || schema) {
        parsed = parseAIJson(text);
        if (parsed === null) {
          throw new AIServiceError(AI_ERROR_CODES.INVALID_RESPONSE, 'Gemini returned invalid JSON.', {
            retryable: false
          });
        }

        if (schema) {
          try {
            validated = validateAIResponse(schema, parsed, validationMessage);
          } catch (error) {
            throw new AIServiceError(
              AI_ERROR_CODES.INVALID_RESPONSE,
              validationMessage || 'Gemini response did not match the expected schema.',
              { retryable: false, cause: error }
            );
          }
        }
      }

      return {
        text,
        data: validated ?? parsed ?? text,
        model
      };
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      if (controller.signal.aborted) {
        throw new AIServiceError(AI_ERROR_CODES.TIMEOUT, 'Gemini request timed out.', {
          retryable: true,
          cause: error
        });
      }
      throw new AIServiceError(AI_ERROR_CODES.PROVIDER_ERROR, 'Gemini is temporarily unavailable.', {
        retryable: true,
        cause: error
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  return Object.freeze({ generate });
};

export const geminiClient = createGeminiClient();
