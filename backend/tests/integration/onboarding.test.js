import { Course } from '../../src/models/Course.js';
import { Enrollment } from '../../src/models/Enrollment.js';
import { CoursePlan } from '../../src/models/CoursePlan.js';
import { User } from '../../src/models/User.js';
import {
  createTestAgent,
  createVerifiedUser,
  loginAs,
  postWithCsrf,
  putWithCsrf
} from '../helpers/auth.helpers.js';

const createCourse = (title, slug) => Course.create({
  title,
  slug,
  category: 'fundamentals',
  availableLevels: ['beginner', 'intermediate'],
  status: 'published'
});

const createActiveEnrollment = async ({ userId, course }) => {
  const enrollment = await Enrollment.create({
    user: userId,
    type: 'course',
    course: course._id,
    currentCourse: course._id,
    level: 'beginner',
    status: 'active',
    onboardingState: 'completed'
  });
  await CoursePlan.create({
    user: userId,
    enrollment: enrollment._id,
    course: course._id,
    title: `${course.title} Roadmap`,
    level: 'beginner',
    modules: [],
    status: 'active',
    isActive: true
  });
  return enrollment;
};

describe('onboarding and enrollment API', () => {
  test('selects a published course, saves level, and rejects duplicate active enrollment', async () => {
    const user = await createVerifiedUser({ email: 'onboarding@example.com' });
    const course = await createCourse('JavaScript', 'javascript');
    const agent = createTestAgent();
    await loginAs(agent, { email: user.email });

    const selection = await postWithCsrf(agent, '/api/onboarding/selection', {
      type: 'course',
      courseId: course._id.toString()
    }, 200);
    const enrollmentId = selection.body.data.enrollment._id;

    const levelResponse = await putWithCsrf(agent, '/api/onboarding/level', {
      enrollmentId,
      level: 'beginner'
    }, 200);
    expect(levelResponse.body.data.enrollment.onboardingState).toBe('roadmap_pending');

    await Enrollment.findByIdAndUpdate(enrollmentId, { status: 'active', onboardingState: 'completed' });
    const duplicate = await postWithCsrf(agent, '/api/onboarding/selection', {
      type: 'course',
      courseId: course._id.toString()
    }, 409);
    expect(duplicate.body.code).toBe('ALREADY_ENROLLED');
  });

  test('lists the current enrollment and switches only to another owned active roadmap', async () => {
    const user = await createVerifiedUser({ email: 'switch@example.com' });
    const firstCourse = await createCourse('JavaScript', 'javascript');
    const secondCourse = await createCourse('React', 'react');
    const firstEnrollment = await createActiveEnrollment({ userId: user._id, course: firstCourse });
    const secondEnrollment = await createActiveEnrollment({ userId: user._id, course: secondCourse });
    await User.findByIdAndUpdate(user._id, { currentEnrollment: firstEnrollment._id });

    const agent = createTestAgent();
    await loginAs(agent, { email: user.email });

    const before = await agent.get('/api/onboarding/enrollments').expect(200);
    expect(before.body.data.enrollments.find((item) => item._id === firstEnrollment._id.toString()).isCurrent).toBe(true);

    await postWithCsrf(agent, `/api/onboarding/enrollments/${secondEnrollment._id}/current`, {}, 200);
    const refreshed = await User.findById(user._id);
    expect(refreshed.currentEnrollment.toString()).toBe(secondEnrollment._id.toString());
  });

  test('cannot switch to another learner enrollment', async () => {
    const user = await createVerifiedUser({ email: 'owner@example.com' });
    const other = await createVerifiedUser({ email: 'other@example.com' });
    const course = await createCourse('JavaScript', 'javascript');
    const otherEnrollment = await createActiveEnrollment({ userId: other._id, course });

    const agent = createTestAgent();
    await loginAs(agent, { email: user.email });
    await postWithCsrf(agent, `/api/onboarding/enrollments/${otherEnrollment._id}/current`, {}, 404);
  });
});
