import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb+srv://swagatam:harekrishnaharekrishna@cluster0.r149hzc.mongodb.net/HRMS?appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET || 'myjwtsecret',
  geminiApiKey: process.env.GEMINI_API_KEY || "AIzaSyBZtqVEgJDEQeUp-78614s3Lf9dUo_o4W4",
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

export const validateEnv = () => {
  const missing = [];

  if (!env.mongoUri) missing.push('MONGO_URI');
  if (!env.jwtSecret) missing.push('JWT_SECRET');

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!env.geminiApiKey) {
    console.warn('GEMINI_API_KEY is not set. Backend will use local fallback scoring.');
  }
};
