import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 140 },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.LEARNER },
    avatar: { type: String, default: '' },
    currentEnrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
    isEmailVerified: { type: Boolean, default: false },
    refreshTokenHash: { type: String, default: null, select: false },
    refreshTokenVersion: { type: Number, default: 0, select: false },
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
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
