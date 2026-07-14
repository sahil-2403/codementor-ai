const parseOrigins = () => {
  const raw = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173';
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
};

export const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = parseOrigins();
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};
