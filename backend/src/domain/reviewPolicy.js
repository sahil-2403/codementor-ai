import { ApiError } from '../utils/ApiError.js';

export const REVIEW_STALE_MS = 5 * 60 * 1000;

export const isReviewStale = (reviewRequestedAt, now = Date.now()) => {
  const requestedAt = reviewRequestedAt ? new Date(reviewRequestedAt).getTime() : 0;
  return !requestedAt || now - requestedAt >= REVIEW_STALE_MS;
};

export const assertReviewCanStart = ({ status, reviewRequestedAt, label }) => {
  if (status === 'reviewing' && !isReviewStale(reviewRequestedAt)) {
    throw new ApiError(409, `${label} is already being reviewed`, [], 'REVIEW_IN_PROGRESS');
  }
  return true;
};
