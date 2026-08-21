import {
  createTestAgent,
  createVerifiedUser,
  loginAs
} from '../helpers/auth.helpers.js';

describe('role authorization', () => {
  test('rejects guests from learner routes', async () => {
    await createTestAgent().get('/api/onboarding/status').expect(401);
  });

  test('rejects admins from learner routes', async () => {
    await createVerifiedUser({ email: 'admin@example.com', role: 'admin' });
    const agent = createTestAgent();
    await loginAs(agent, { email: 'admin@example.com' });
    await agent.get('/api/onboarding/status').expect(403);
  });

  test('rejects learners from admin routes', async () => {
    await createVerifiedUser({ email: 'learner@example.com' });
    const agent = createTestAgent();
    await loginAs(agent, { email: 'learner@example.com' });
    await agent.get('/api/admin/content-overview').expect(403);
  });

  test('allows admins to access admin routes', async () => {
    await createVerifiedUser({ email: 'admin@example.com', role: 'admin' });
    const agent = createTestAgent();
    await loginAs(agent, { email: 'admin@example.com' });
    const response = await agent.get('/api/admin/content-overview').expect(200);
    expect(response.body.success).toBe(true);
  });
});
