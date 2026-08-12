import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new ApiError(401, 'Authentication required');

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('+tokenVersion');

    if (!user) throw new ApiError(401, 'Invalid token user');
    if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      throw new ApiError(401, 'Session expired');
    }
    if (!user.isEmailVerified) {
      throw new ApiError(403, 'Email verification required');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid or expired token'));
  }
};
