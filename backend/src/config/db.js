import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');
  return mongoose.connection;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close();
  console.log('MongoDB disconnected');
};
