import { Technology } from '../../src/models/Technology.js';
import {
  createTestAgent,
  createVerifiedUser,
  deleteWithCsrf,
  loginAs,
  patchWithCsrf,
  postWithCsrf
} from '../helpers/auth.helpers.js';

describe('admin content lifecycle', () => {
  test('requires archive before permanent deletion', async () => {
    await createVerifiedUser({ email: 'admin@example.com', role: 'admin' });
    const agent = createTestAgent();
    await loginAs(agent, { email: 'admin@example.com' });

    const created = await postWithCsrf(agent, '/api/admin/technologies', {
      name: 'JavaScript',
      type: 'language',
      description: 'Programming language'
    }, 201);
    const id = created.body.data.technology._id;

    const blockedDelete = await deleteWithCsrf(agent, `/api/admin/technologies/${id}`, 409);
    expect(blockedDelete.body.code).toBe('DELETE_REQUIRES_ARCHIVE');

    const archived = await patchWithCsrf(agent, `/api/admin/technologies/${id}/status`, {
      status: 'archived'
    }, 200);
    expect(archived.body.data.technology.status).toBe('archived');

    await deleteWithCsrf(agent, `/api/admin/technologies/${id}`, 200);
    expect(await Technology.findById(id)).toBeNull();
  });
});
