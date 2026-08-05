import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { accessCookieOptions, clearCookieOptions, refreshCookieOptions } from '../config/cookies.js';
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

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, accessCookieOptions());
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
};

export const clearAuthCookies = (res) => {
  const options = clearCookieOptions();
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
};

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
