import express from 'express';
import cors from 'cors';
import { env, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

validateEnv();

const app = express();

const allowedOrigins = env.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Interviewer API',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/user', userRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`AI Interviewer API running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
