import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

export const validateEnv = () => {
  const missing = [];

  if (!env.mongoUri) missing.push('MONGO_URI');
  if (!env.jwtSecret || env.jwtSecret === 'change-me-in-production') missing.push('JWT_SECRET');

  if (env.nodeEnv === 'production' && missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (missing.length) {
    console.warn(`Missing environment variables for local development: ${missing.join(', ')}`);
  }

  if (!env.geminiApiKey) {
    console.warn('GEMINI_API_KEY is not set. Backend will use local fallback scoring.');
  }
};
