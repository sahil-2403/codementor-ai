import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  accessCookieOptions,
  refreshCookieOptions,
  clearAccessCookieOptions,
  clearRefreshCookieOptions
} from '../config/cookies.js';

export const createAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );

export const createRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion || 0 },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );

export const setAccessTokenCookie = (res, accessToken) => {
  res.cookie('accessToken', accessToken, accessCookieOptions());
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  setAccessTokenCookie(res, accessToken);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
};

export const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', clearAccessCookieOptions());
  res.clearCookie('refreshToken', clearRefreshCookieOptions());
};

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
