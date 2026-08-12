import { RevisionItem } from '../models/RevisionItem.js';
import { getActiveCourseForUser } from './dataIntegrity.service.js';

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const delayByPriority = {
  low: 7,
  medium: 3,
  high: 1,
  critical: 0
};

export const scheduleRevisionForWeakTopic = async ({ userId, coursePlanId, weakTopic, source = 'quiz' }) => {
  if (!weakTopic?.topic) return null;

  const existingPending = await RevisionItem.findOne({
    user: userId,
    coursePlan: coursePlanId,
    topic: weakTopic.topic,
    status: 'pending'
  });

  const priority = weakTopic.severity || 'medium';
  const dueDate = addDays(new Date(), delayByPriority[priority] ?? 3);

  if (existingPending) {
    existingPending.priority = priority;
    existingPending.source = source;
    existingPending.dueDate = existingPending.dueDate > dueDate ? dueDate : existingPending.dueDate;
    existingPending.reason = `Repeated weakness detected from ${source}.`;
    await existingPending.save();
    return existingPending;
  }

  return RevisionItem.create({
    user: userId,
    coursePlan: coursePlanId,
    topic: weakTopic.topic,
    priority,
    dueDate,
    source,
    reason: `Revision scheduled because ${weakTopic.topic} was detected as a ${priority} weak topic.`
  });
};

const priorityRank = { low: 1, medium: 2, high: 3, critical: 4 };

export const getDueRevisions = async ({ userId, coursePlanId, limit = 5 }) => {
  const revisions = await RevisionItem.find({
    user: userId,
    coursePlan: coursePlanId,
    status: 'pending',
    dueDate: { $lte: addDays(new Date(), 1) }
  }).lean();

  return revisions
    .sort((a, b) => (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0) || new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, limit);
};

export const getRevisionStats = async ({ userId, coursePlanId }) => {
  const [pending, completed, overdue] = await Promise.all([
    RevisionItem.countDocuments({ user: userId, coursePlan: coursePlanId, status: 'pending' }),
    RevisionItem.countDocuments({ user: userId, coursePlan: coursePlanId, status: 'completed' }),
    RevisionItem.countDocuments({ user: userId, coursePlan: coursePlanId, status: 'pending', dueDate: { $lt: new Date() } })
  ]);
  return { pending, completed, overdue };
};

export const updateRevisionStatus = async ({ userId, revisionId, status }) => {
  const course = await getActiveCourseForUser({ userId });
  if (!course) return null;

  const revision = await RevisionItem.findOne({
    _id: revisionId,
    user: userId,
    coursePlan: course._id
  });
  if (!revision) return null;
  revision.status = status;
  await revision.save();
  return revision;
};
