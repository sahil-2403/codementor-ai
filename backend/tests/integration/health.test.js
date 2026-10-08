import request from 'supertest';
import app from '../../src/app.js';

describe('health endpoint', () => {
  test('returns a healthy response', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.environment).toBe('test');
  });
});
