import jwt from 'jsonwebtoken';
import { sha256 } from '../utils/hash.js';

export const createAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.refreshTokenVersion || 0 },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

export const createRefreshToken = (user) =>
  jwt.sign({ id: user._id, version: user.refreshTokenVersion || 0 }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });

export const hashToken = (token) => sha256(token);

const cookieBase = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true'
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

export const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);
