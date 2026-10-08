import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const googleClient = new OAuth2Client();

export const verifyGoogleCredential = async (credential) => {
  if (!env.googleClientId) {
    throw new ApiError(503, 'Google sign-in is not configured', [], 'GOOGLE_AUTH_NOT_CONFIGURED');
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email || payload.email_verified !== true) {
      throw new Error('Incomplete Google identity payload');
    }

    return {
      googleId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: payload.name?.trim() || 'Google Learner',
      avatar: payload.picture?.trim() || ''
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Google authentication failed', [], 'GOOGLE_AUTH_FAILED');
  }
};
