import { ApiError } from '../utils/ApiError.js';

export const createAttempt = async ({ model, identityFilter, payload, limitMessage }) => {
  const attemptsUsed = await model.countDocuments(identityFilter);
  if (attemptsUsed >= 2) {
    throw new ApiError(409, limitMessage, [], 'ATTEMPT_LIMIT_REACHED');
  }

  return model.create({
    ...payload,
    attemptNumber: attemptsUsed + 1
  });
};
