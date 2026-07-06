let io = null;

export const setSocketServer = (server) => {
  io = server;
};

export const getSocketServer = () => io;

export const rooms = {
  recruiter: (recruiterId) => `recruiter:${recruiterId}`,
  interview: (interviewId) => `interview:${interviewId}`,
  session: (sessionId) => `session:${sessionId}`
};

export const emitToRecruiter = (recruiterId, event, payload) => {
  if (!io || !recruiterId) return;
  io.to(rooms.recruiter(recruiterId)).emit(event, payload);
};

export const emitToInterview = (interviewId, event, payload) => {
  if (!io || !interviewId) return;
  io.to(rooms.interview(interviewId)).emit(event, payload);
};

export const emitToSession = (sessionId, event, payload) => {
  if (!io || !sessionId) return;
  io.to(rooms.session(sessionId)).emit(event, payload);
};

export const emitSessionEvent = (session, event, payload = {}) => {
  const data = {
    sessionId: String(session._id || session.id),
    interviewId: String(session.interview),
    recruiterId: String(session.recruiter),
    ...payload
  };

  emitToSession(data.sessionId, event, data);
  emitToInterview(data.interviewId, event, data);
  emitToRecruiter(data.recruiterId, event, data);
};
