import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/codementor_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.COOKIE_SECURE = 'false';
process.env.COOKIE_SAME_SITE = 'lax';
process.env.TRUST_PROXY = 'false';
process.env.API_RATE_LIMIT = '10000';
process.env.AUTH_RATE_LIMIT = '10000';
process.env.REGISTER_RATE_LIMIT = '10000';
process.env.PASSWORD_RESET_RATE_LIMIT = '10000';
process.env.AI_ROUTE_RATE_LIMIT = '10000';
process.env.ADMIN_WRITE_RATE_LIMIT = '10000';
process.env.ENABLE_AI = 'false';
process.env.EMAIL_ENABLED = 'false';
process.env.ALLOW_DEV_EMAIL_LOG = 'false';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});
