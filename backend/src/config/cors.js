import { env } from './env.js';

export const corsOptions = {
  origin(origin, callback) {
    if (!origin && !env.isProduction) return callback(null, true);
    if (env.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};
