import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.js';

export const createTestAgent = () => request.agent(app);

export const getCsrfToken = async (agent) => {
  const response = await agent.get('/api/auth/csrf-token').expect(200);
  return response.body.data.csrfToken;
};

export const postWithCsrf = async (agent, path, body = {}, expectedStatus = 200) => {
  const csrfToken = await getCsrfToken(agent);
  return agent
    .post(path)
    .set('X-CSRF-Token', csrfToken)
    .send(body)
    .expect(expectedStatus);
};

export const patchWithCsrf = async (agent, path, body = {}, expectedStatus = 200) => {
  const csrfToken = await getCsrfToken(agent);
  return agent
    .patch(path)
    .set('X-CSRF-Token', csrfToken)
    .send(body)
    .expect(expectedStatus);
};

export const deleteWithCsrf = async (agent, path, expectedStatus = 200) => {
  const csrfToken = await getCsrfToken(agent);
  return agent
    .delete(path)
    .set('X-CSRF-Token', csrfToken)
    .expect(expectedStatus);
};

export const createVerifiedUser = async ({
  name = 'Test User',
  email = 'learner@example.com',
  password = 'Password123!',
  role = 'learner'
} = {}) => User.create({ name, email, password, role, isEmailVerified: true });

export const loginAs = async (agent, { email, password = 'Password123!' }) => {
  await postWithCsrf(agent, '/api/auth/login', { email, password }, 200);
  return agent;
};
