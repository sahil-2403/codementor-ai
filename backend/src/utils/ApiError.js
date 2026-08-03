export class ApiError extends Error {
  constructor(statusCode, message, errors = [], code = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code || defaultCodeForStatus(statusCode);
    this.isOperational = true;
    Error.captureStackTrace?.(this, ApiError);
  }
}

const defaultCodeForStatus = (statusCode) => {
  if (statusCode === 400) return 'VALIDATION_ERROR';
  if (statusCode === 401) return 'AUTH_REQUIRED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'RESOURCE_NOT_FOUND';
  if (statusCode === 409) return 'CONFLICT';
  if (statusCode === 429) return 'RATE_LIMITED';
  return statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED';
};
