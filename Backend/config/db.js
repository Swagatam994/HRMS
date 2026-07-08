import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';
import { User } from '../models/User.js';

let memoryServer;

const seedLocalUser = async () => {
  const existing = await User.findOne({ email: 'admin@example.com' });
  if (existing) return;

  await User.create({
    name: 'Local Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'recruiter',
    organization: 'Local Dev'
  });
};

export const connectDB = async () => {
  mongoose.set('strictQuery', true);

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    if (env.nodeEnv === 'production') {
      throw error;
    }

    console.warn(`MongoDB unavailable (${error.message}). Starting an in-memory MongoDB instance for local development.`);
    memoryServer = await MongoMemoryServer.create();
    const connection = await mongoose.connect(memoryServer.getUri());
    await seedLocalUser();
    console.log(`MongoDB connected to memory server: ${connection.connection.host}`);
    return connection;
  }
};
