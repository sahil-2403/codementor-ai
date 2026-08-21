import { User } from '../../src/models/User.js';
import { Course } from '../../src/models/Course.js';
import { Topic } from '../../src/models/Topic.js';
import { Lesson } from '../../src/models/Lesson.js';
import { RoadmapTemplate } from '../../src/models/RoadmapTemplate.js';
import { Enrollment } from '../../src/models/Enrollment.js';
import { CoursePlan } from '../../src/models/CoursePlan.js';
import {
  createTestAgent,
  createVerifiedUser,
  loginAs,
  postWithCsrf
} from '../helpers/auth.helpers.js';

const createDemoStarterContent = async () => {
  const course = await Course.create({
    title: 'Complete JavaScript',
    slug: 'complete-javascript',
    category: 'fundamentals',
    availableLevels: ['beginner'],
    status: 'published'
  });
  const topic = await Topic.create({
    course: course._id,
    title: 'JavaScript Basics',
    slug: 'javascript-basics',
    category: 'fundamentals',
    status: 'active'
  });
  const lesson = await Lesson.create({
    course: course._id,
    title: 'Variables',
    slug: 'variables',
    topic: topic._id,
    theory: 'Variables store values that can be used later in a JavaScript program.',
    status: 'published'
  });
  await RoadmapTemplate.create({
    course: course._id,
    level: 'beginner',
    title: 'JavaScript Beginner Roadmap',
    description: 'Starter roadmap',
    modules: [{
      title: 'JavaScript Basics',
      description: 'Learn the basics',
      order: 1,
      durationDays: 7,
      lessons: [lesson._id],
      quizTags: []
    }],
    estimatedDurationDays: 7,
    status: 'published'
  });
};

describe('authentication API', () => {
  test('registers a learner and stores a hashed password', async () => {
    const agent = createTestAgent();
    const response = await postWithCsrf(agent, '/api/auth/register', {
      name: 'New Learner',
      email: 'new@example.com',
      password: 'Password123!'
    }, 201);

    expect(response.body.success).toBe(true);
    const user = await User.findOne({ email: 'new@example.com' }).select('+password');
    expect(user).not.toBeNull();
    expect(user.password).not.toBe('Password123!');
    expect(user.role).toBe('learner');
    expect(user.isEmailVerified).toBe(false);
  });

  test('rejects duplicate registration and unverified login', async () => {
    const agent = createTestAgent();
    const payload = { name: 'Learner', email: 'duplicate@example.com', password: 'Password123!' };
    await postWithCsrf(agent, '/api/auth/register', payload, 201);
    await postWithCsrf(agent, '/api/auth/register', payload, 409);
    await postWithCsrf(agent, '/api/auth/login', { email: payload.email, password: payload.password }, 403);
  });

  test('logs in a verified user with auth cookies and logout-all revokes sessions', async () => {
    const user = await createVerifiedUser({ email: 'verified@example.com' });
    const agent = createTestAgent();
    const response = await postWithCsrf(agent, '/api/auth/login', {
      email: 'verified@example.com',
      password: 'Password123!'
    }, 200);

    const cookies = response.headers['set-cookie'] || [];
    expect(cookies.some((cookie) => cookie.startsWith('accessToken='))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith('refreshToken='))).toBe(true);

    await postWithCsrf(agent, '/api/auth/logout-all', {}, 200);
    const refreshed = await User.findById(user._id).select('+tokenVersion');
    expect(refreshed.tokenVersion).toBe(1);
  });

  test('creates a separate ready-to-use learner for every demo request', async () => {
    await createDemoStarterContent();
    const first = await postWithCsrf(createTestAgent(), '/api/auth/demo-account', {}, 201);
    const second = await postWithCsrf(createTestAgent(), '/api/auth/demo-account', {}, 201);

    expect(first.body.data.credentials.email).not.toBe(second.body.data.credentials.email);
    const demoUsers = await User.find({ isDemo: true });
    expect(demoUsers).toHaveLength(2);
    expect(demoUsers.every((user) => user.isEmailVerified && user.currentEnrollment)).toBe(true);
    expect(await Enrollment.countDocuments({ user: { $in: demoUsers.map((user) => user._id) } })).toBe(2);
    expect(await CoursePlan.countDocuments({ user: { $in: demoUsers.map((user) => user._id) }, isActive: true })).toBe(2);
  });
});
