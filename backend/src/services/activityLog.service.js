import { ActivityLog } from '../models/ActivityLog.js';

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
