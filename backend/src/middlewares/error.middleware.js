import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { isAIServiceError } from '../ai/aiErrors.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`, [], 'RESOURCE_NOT_FOUND'));
};

const normalizeError = (error) => {
  if (isAIServiceError(error)) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      errors: []
    };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: Object.values(error.errors).map((item) => ({
        field: item.path,
        message: item.message
      }))
    };
  }

  if (error?.code === 11000) {
    return {
      statusCode: 409,
      code: 'CONFLICT',
      message: 'A record with these values already exists',
      errors: Object.keys(error.keyPattern || error.keyValue || {}).map((field) => ({
        field,
        message: `${field} must be unique`
      }))
    };
  }

  if (error instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid resource identifier',
      errors: [{ field: error.path, message: 'Invalid value' }]
    };
  }

  const statusCode = error.statusCode || 500;
  return {
    statusCode,
    code: error.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED'),
    message: error.message || 'Internal server error',
    errors: error.errors || []
  };
};

export const errorHandler = (error, req, res, next) => {
  const normalized = normalizeError(error);
  const isServerError = normalized.statusCode >= 500;

  if (!env.isTest) {
    console.error('Request failed:', normalized.message);
  }

  res.status(normalized.statusCode).json({
    success: false,
    code: normalized.code,
    message: env.isProduction && isServerError ? 'Internal server error' : normalized.message,
    errors: normalized.errors,
    stack: env.isDevelopment ? error.stack : undefined
  });
};
