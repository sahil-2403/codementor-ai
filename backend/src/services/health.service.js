import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { getEmailTransportStatus } from '../email/emailTransport.js';
import { getRedisStatus } from '../config/redis.js';

export const getLiveness = () => ({
  status: 'ok',
  service: 'codementor-ai-api',
  environment: env.nodeEnv,
  uptimeSeconds: Math.floor(process.uptime()),
  timestamp: new Date().toISOString()
});

export const getReadiness = () => {
  const mongoReady = mongoose.connection.readyState === 1;
  const email = getEmailTransportStatus();
  const redis = getRedisStatus();

  return {
    ready: mongoReady,
    checks: {
      mongodb: {
        required: true,
        ready: mongoReady
      },
      gemini: {
        required: false,
        enabled: env.enableAi,
        configured: Boolean(env.geminiApiKey)
      },
      email: {
        required: false,
        enabled: env.emailEnabled,
        available: env.emailEnabled ? email.available : false,
        checked: email.checked
      },
      redis: {
        required: false,
        enabled: redis.enabled,
        ready: redis.ready
      }
    },
    timestamp: new Date().toISOString()
  };
};
