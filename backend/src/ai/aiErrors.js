export const AI_ERROR_CODES = Object.freeze({
  DISABLED: 'GEMINI_DISABLED',
  NOT_CONFIGURED: 'GEMINI_NOT_CONFIGURED',
  TIMEOUT: 'GEMINI_TIMEOUT',
  RATE_LIMITED: 'GEMINI_RATE_LIMITED',
  PROVIDER_ERROR: 'GEMINI_PROVIDER_ERROR',
  INVALID_RESPONSE: 'GEMINI_INVALID_RESPONSE',
  SAFETY_REJECTION: 'GEMINI_SAFETY_REJECTION',
  REQUEST_ABORTED: 'GEMINI_REQUEST_ABORTED'
});

const defaultStatusByCode = Object.freeze({
  [AI_ERROR_CODES.DISABLED]: 503,
  [AI_ERROR_CODES.NOT_CONFIGURED]: 503,
  [AI_ERROR_CODES.TIMEOUT]: 504,
  [AI_ERROR_CODES.RATE_LIMITED]: 429,
  [AI_ERROR_CODES.PROVIDER_ERROR]: 502,
  [AI_ERROR_CODES.INVALID_RESPONSE]: 502,
  [AI_ERROR_CODES.SAFETY_REJECTION]: 422,
  [AI_ERROR_CODES.REQUEST_ABORTED]: 499
});

export class AIServiceError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'AIServiceError';
    this.code = code;
    this.statusCode = options.statusCode || defaultStatusByCode[code] || 500;
    this.retryable = Boolean(options.retryable);
    this.providerStatus = options.providerStatus || null;
    this.details = options.details || null;
  }
}

export const isAIServiceError = (error) => error instanceof AIServiceError;
