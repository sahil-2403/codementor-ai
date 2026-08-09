import { User } from '../models/User.js';
import { Enrollment } from '../models/Enrollment.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { ApiError } from '../utils/ApiError.js';
import { invalidateUserLearningCache } from './cacheInvalidation.service.js';

const enrollmentPopulate = [
  {
    path: 'course',
    select: 'title slug description category technologies primaryTechnology status',
    populate: [
      { path: 'technologies', select: 'name slug type iconKey' },
      { path: 'primaryTechnology', select: 'name slug type iconKey' }
    ]
  },
  {
    path: 'learningPath',
    select: 'title slug description category technologies status',
    populate: { path: 'technologies', select: 'name slug type iconKey' }
  },
  {
    path: 'currentCourse',
    select: 'title slug description category technologies primaryTechnology status',
    populate: [
      { path: 'technologies', select: 'name slug type iconKey' },
      { path: 'primaryTechnology', select: 'name slug type iconKey' }
    ]
  }
];

export const listMyLearning = async (userId) => {
  const [user, enrollments] = await Promise.all([
    User.findById(userId).select('_id currentEnrollment').lean(),
    Enrollment.find({ user: userId, status: { $in: ['active', 'completed'] } })
      .sort({ updatedAt: -1 })
      .populate(enrollmentPopulate)
      .lean()
  ]);

  const enrollmentIds = enrollments.map((enrollment) => enrollment._id);
  const coursePlans = enrollmentIds.length
    ? await CoursePlan.find({
      user: userId,
      enrollment: { $in: enrollmentIds },
      status: 'active',
      isActive: true
    })
      .select('_id enrollment course learningPath title description level version roadmapType aiGenerated createdAt updatedAt')
      .lean()
    : [];

  const planByEnrollment = new Map(coursePlans.map((plan) => [String(plan.enrollment), plan]));
  const items = enrollments
    .map((enrollment) => ({
      enrollment,
      coursePlan: planByEnrollment.get(String(enrollment._id)) || null,
      title: enrollment.type === 'learning_path'
        ? enrollment.learningPath?.title || enrollment.currentCourse?.title || 'Learning path'
        : enrollment.course?.title || enrollment.currentCourse?.title || 'Course',
      currentCourse: enrollment.currentCourse || enrollment.course || null
    }))
    .filter((item) => Boolean(item.coursePlan));

  const requestedCurrentId = user?.currentEnrollment ? String(user.currentEnrollment) : null;
  const currentItem = items.find((item) => String(item.enrollment._id) === requestedCurrentId) || items[0] || null;

  if (currentItem && requestedCurrentId !== String(currentItem.enrollment._id)) {
    await User.updateOne({ _id: userId }, { $set: { currentEnrollment: currentItem.enrollment._id } });
  }

  return {
    currentEnrollmentId: currentItem?.enrollment?._id || null,
    currentCoursePlanId: currentItem?.coursePlan?._id || null,
    items
  };
};

export const selectCurrentLearning = async ({ userId, enrollmentId }) => {
  const [enrollment, coursePlan] = await Promise.all([
    Enrollment.findOne({ _id: enrollmentId, user: userId, status: { $in: ['active', 'completed'] } })
      .populate(enrollmentPopulate),
    CoursePlan.findOne({ user: userId, enrollment: enrollmentId, status: 'active', isActive: true })
      .select('_id enrollment title level version course learningPath')
  ]);

  if (!enrollment || !coursePlan) {
    throw new ApiError(404, 'Active learning enrollment not found', [], 'ENROLLMENT_NOT_FOUND');
  }

  await User.updateOne({ _id: userId }, { $set: { currentEnrollment: enrollment._id } });
  await invalidateUserLearningCache(userId);

  return { enrollment, coursePlan };
};
