import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Interview } from '../models/Interview.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { User } from '../models/User.js';
import { emitSessionEvent, rooms, setSocketServer } from '../services/socketService.js';

const withSocketError = (socket, handler) => async (payload = {}, ack) => {
  try {
    const result = await handler(payload);
    if (typeof ack === 'function') ack({ ok: true, data: result });
  } catch (error) {
    const message = error.message || 'Socket action failed.';
    socket.emit('socket:error', { message });
    if (typeof ack === 'function') ack({ ok: false, message });
  }
};

const getToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers?.authorization || '';
  return authToken || (header.startsWith('Bearer ') ? header.slice(7) : null);
};

const findCandidateSession = async (socket, sessionId) => {
  const session = await InterviewSession.findOne({ _id: sessionId, candidate: socket.user._id });
  if (!session) throw new Error('Interview session not found.');
  return session;
};

export const setupInterviewSockets = (io) => {
  setSocketServer(io);

  io.use(async (socket, next) => {
    try {
      const token = getToken(socket);
      if (!token) throw new Error('Authentication token is required.');

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id);
      if (!user) throw new Error('User not found for this token.');

      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user._id}`);

    socket.on(
      'hr:join-dashboard',
      withSocketError(socket, async () => {
        if (socket.user.role !== 'recruiter') throw new Error('Recruiter access is required.');
        socket.join(rooms.recruiter(socket.user._id));
        return { room: rooms.recruiter(socket.user._id) };
      })
    );

    socket.on(
      'hr:join-interview',
      withSocketError(socket, async ({ interviewId }) => {
        if (socket.user.role !== 'recruiter') throw new Error('Recruiter access is required.');
        const interview = await Interview.findOne({ _id: interviewId, recruiter: socket.user._id });
        if (!interview) throw new Error('Interview not found.');
        socket.join(rooms.recruiter(socket.user._id));
        socket.join(rooms.interview(interview._id));
        return { room: rooms.interview(interview._id) };
      })
    );

    socket.on(
      'hr:join-session',
      withSocketError(socket, async ({ sessionId }) => {
        if (socket.user.role !== 'recruiter') throw new Error('Recruiter access is required.');
        const session = await InterviewSession.findOne({ _id: sessionId, recruiter: socket.user._id });
        if (!session) throw new Error('Session not found.');
        socket.join(rooms.recruiter(socket.user._id));
        socket.join(rooms.interview(session.interview));
        socket.join(rooms.session(session._id));
        return { room: rooms.session(session._id) };
      })
    );

    socket.on(
      'candidate:join-session',
      withSocketError(socket, async ({ sessionId }) => {
        if (socket.user.role !== 'candidate') throw new Error('Candidate access is required.');
        const session = await findCandidateSession(socket, sessionId);
        socket.join(rooms.session(session._id));
        emitSessionEvent(session, 'candidate:joined', {
          status: session.status,
          candidate: {
            id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email
          },
          at: new Date().toISOString()
        });
        return { room: rooms.session(session._id) };
      })
    );

    socket.on(
      'candidate:speaking',
      withSocketError(socket, async ({ sessionId, speaking = true }) => {
        const session = await findCandidateSession(socket, sessionId);
        session.lastActivityAt = new Date();
        await session.save();
        emitSessionEvent(session, 'candidate:speaking', {
          speaking: Boolean(speaking),
          at: new Date().toISOString()
        });
      })
    );

    socket.on(
      'transcript:update',
      withSocketError(socket, async ({ sessionId, transcript = '' }) => {
        const session = await findCandidateSession(socket, sessionId);
        session.liveTranscript = String(transcript).slice(0, 10000);
        session.lastActivityAt = new Date();
        await session.save();
        emitSessionEvent(session, 'transcript:update', {
          transcript: session.liveTranscript,
          at: new Date().toISOString()
        });
      })
    );
  });
};
