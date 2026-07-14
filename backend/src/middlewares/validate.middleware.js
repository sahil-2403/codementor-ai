import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    const errors = result.error.errors.map((error) => ({
      path: error.path.join('.'),
      message: error.message
    }));
    return next(new ApiError(400, 'Validation failed', errors));
  }

  req.validated = result.data;
  if (Object.prototype.hasOwnProperty.call(result.data, 'body')) req.body = result.data.body;
  if (Object.prototype.hasOwnProperty.call(result.data, 'params')) req.params = result.data.params;
  if (Object.prototype.hasOwnProperty.call(result.data, 'query')) req.query = result.data.query;
  next();
};
