import { ApiError } from '../utils/ApiError.js';

const isAttemptSlotConflict = (error) =>
  error?.code === 11000 &&
  (Boolean(error?.keyPattern?.attemptNumber) || Boolean(error?.keyValue?.attemptNumber));

export const createInAvailableAttemptSlot = async ({
  model,
  identityFilter,
  payload,
  limitMessage
}) => {
  const legacyRecordExists = await model.exists({
    ...identityFilter,
    attemptNumber: null
  });

  if (legacyRecordExists) {
    throw new ApiError(
      503,
      'Attempt records require migration before new attempts can be created',
      [],
      'ATTEMPT_MIGRATION_REQUIRED'
    );
  }

  for (const attemptNumber of [1, 2]) {
    try {
      return await model.create({ ...payload, attemptNumber });
    } catch (error) {
      if (isAttemptSlotConflict(error)) continue;
      throw error;
    }
  }

  throw new ApiError(409, limitMessage, [], 'ATTEMPT_LIMIT_REACHED');
};
