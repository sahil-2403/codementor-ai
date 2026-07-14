import { ActivityLog } from '../models/ActivityLog.js';
import { makeSearchRegex } from '../utils/pagination.js';
import { listWithPagination } from './listQuery.service.js';

export const logActivity = async ({
  user = null,
  action,
  entityType,
  entityId = null,
  message = '',
  severity = 'info',
  metadata = {},
  req = null
}) => {
  try {
    return await ActivityLog.create({
      user,
      action,
      entityType,
      entityId,
      message,
      severity,
      metadata,
      ipAddress: req?.ip || '',
      userAgent: req?.headers?.['user-agent'] || ''
    });
  } catch (error) {
    console.warn('Activity log failed:', error.message);
    return null;
  }
};

export const listActivityLogs = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};

  if (search) filter.$or = [{ action: search }, { entityType: search }, { message: search }];
  if (query.action) filter.action = query.action;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.severity) filter.severity = query.severity;
  if (query.user) filter.user = query.user;

  return listWithPagination({ model: ActivityLog, filter, query, populate: [{ path: 'user', select: 'name email role' }] });
};

export const getRecentActivitiesForUser = async (userId, limit = 8) => {
  return ActivityLog.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('action entityType message metadata createdAt');
};
