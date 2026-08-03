import crypto from 'crypto';

const sanitizeRequestId = (value) => {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 128) return null;
  return /^[A-Za-z0-9._:-]+$/.test(candidate) ? candidate : null;
};

export const requestId = (req, res, next) => {
  const incoming = sanitizeRequestId(req.get('x-request-id'));
  req.requestId = incoming || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};
