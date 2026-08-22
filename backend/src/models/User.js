import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/roles.js';
import { AUTH_PROVIDERS } from '../constants/authProviders.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 140 },
    password: {
      type: String,
      required() {
        return this.authProvider === AUTH_PROVIDERS.LOCAL;
      },
      minlength: 8,
      select: false
    },
    authProvider: {
      type: String,
      enum: Object.values(AUTH_PROVIDERS),
      required: true,
      default: AUTH_PROVIDERS.LOCAL
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      required() {
        return this.authProvider === AUTH_PROVIDERS.GOOGLE;
      }
    },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.LEARNER },
    avatar: { type: String, default: '' },
    currentEnrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
    isEmailVerified: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0, min: 0, select: false },
    passwordResetToken: { type: String, default: '', select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
    emailVerificationToken: { type: String, default: '', select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ isEmailVerified: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);