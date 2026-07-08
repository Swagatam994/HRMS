import express from 'express';
import cors from 'cors';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { env, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import recruiterRoutes from './routes/recruiterRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { setupInterviewSockets } from './socket/interviewSocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../Frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

validateEnv();

const app = express();
const httpServer = http.createServer(app);

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Interviewer API',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/hr', recruiterRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/user', userRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (_req, res) => {
    if (fs.existsSync(frontendIndexPath)) {
      res.sendFile(frontendIndexPath);
    } else {
      res.status(404).json({ message: 'Frontend build not found.' });
    }
  });
} else {
  app.use(notFound);
}

app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : '*',
      credentials: true
    }
  });
  setupInterviewSockets(io);

  const startPort = Number.parseInt(env.port, 10) || 5000;
  const maxAttempts = 10;

  const tryListen = (port) =>
    new Promise((resolve, reject) => {
      const onError = (error) => {
        httpServer.off('error', onError);
        reject(error);
      };

      httpServer.once('error', onError);
      httpServer.listen(port, () => {
        httpServer.off('error', onError);
        resolve(port);
      });
    });

  let actualPort = startPort;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      actualPort = await tryListen(startPort + attempt);
      break;
    } catch (error) {
      if (error.code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }

  if (actualPort !== startPort) {
    console.warn(`Port ${startPort} was busy. Using port ${actualPort} instead.`);
  }

  env.port = actualPort;
  console.log(`AI Interviewer API running on port ${env.port}`);
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
