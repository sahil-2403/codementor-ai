import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sha256 } from '../utils/hash.js';

export const createAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.refreshTokenVersion || 0 },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );

export const createRefreshToken = (user) =>
  jwt.sign({ id: user._id, version: user.refreshTokenVersion || 0 }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn
  });

export const hashToken = (token) => sha256(token);

const cookieBase = () => ({
  httpOnly: true,
  sameSite: env.cookieSameSite,
  secure: env.cookieSecure,
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {})
});

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...cookieBase(),
    maxAge: 15 * 60 * 1000
  });
  res.cookie('refreshToken', refreshToken, {
    ...cookieBase(),
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const clearAuthCookies = (res) => {
  const options = cookieBase();
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
};

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
