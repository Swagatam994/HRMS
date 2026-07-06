import { Candidate } from '../models/Candidate.js';
import { Evaluation } from '../models/Evaluation.js';
import { Interview } from '../models/Interview.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { evaluateAnswer, generateInterviewSummary } from '../services/geminiService.js';
import { buildRankingForSession, calculateRunningScore, recommendFromScore } from '../services/rankingService.js';
import { emitSessionEvent } from '../services/socketService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const serializeQuestion = (question) => {
  if (!question) return null;
  return {
    id: question.id,
    question: question.question,
    difficulty: question.difficulty,
    type: question.type,
    tags: question.tags || []
  };
};

const serializeAnswerForCandidate = (answer, includeFeedback = false) => ({
  id: String(answer._id || answer.id),
  questionId: answer.questionId,
  question: answer.question,
  transcript: answer.transcript,
  mode: answer.mode,
  durationSeconds: answer.durationSeconds,
  evaluatedAt: answer.evaluatedAt,
  feedback: includeFeedback ? answer.feedback : undefined
});

const serializeSession = (session, interview, includeFeedback = false) => ({
  id: String(session._id),
  _id: String(session._id),
  interview: {
    id: String(interview._id),
    title: interview.title,
    role: interview.role,
    experienceLevel: interview.experienceLevel,
    difficulty: interview.difficulty,
    interviewType: interview.interviewType,
    numberOfQuestions: interview.numberOfQuestions,
    settings: interview.settings
  },
  status: session.status,
  currentQuestionIndex: session.currentQuestionIndex || 0,
  currentQuestion: serializeQuestion(session.questions?.[session.currentQuestionIndex]),
  questions: (session.questions || []).map(serializeQuestion),
  answers: (session.answers || []).map((answer) => serializeAnswerForCandidate(answer, includeFeedback)),
  liveTranscript: session.liveTranscript || '',
  runningScore: session.runningScore || {},
  startedAt: session.startedAt,
  endedAt: session.endedAt,
  elapsedSeconds: session.elapsedSeconds || 0,
  finalReport: session.finalReport || {},
  createdAt: session.createdAt,
  updatedAt: session.updatedAt
});

const getCandidateProfile = async (userId) =>
  Candidate.findOneAndUpdate({ user: userId }, { user: userId }, { upsert: true, new: true, setDefaultsOnInsert: true });

const loadCandidateSession = async (sessionId, candidateId) => {
  const session = await InterviewSession.findOne({ _id: sessionId, candidate: candidateId });
  if (!session) throw new AppError('Interview session not found.', 404);

  const interview = await Interview.findById(session.interview);
  if (!interview) throw new AppError('Assigned interview was not found.', 404);

  return { session, interview };
};

const finalizeSession = async ({ session, interview, elapsedSeconds }) => {
  const report = await generateInterviewSummary({
    ...session.toObject(),
    role: interview.role,
    experienceLevel: interview.experienceLevel,
    difficulty: interview.difficulty,
    interviewType: interview.interviewType
  });
  const runningScore = calculateRunningScore(session.answers, interview.scoringCriteria);
  const recommendation = recommendFromScore(runningScore.overallScore || report.overallScore, interview.scoringCriteria);

  session.runningScore = runningScore;
  session.finalReport = {
    ...report,
    overallScore: runningScore.overallScore || report.overallScore,
    recommendation,
    generatedAt: new Date()
  };
  session.status = 'completed';
  session.endedAt = new Date();
  session.elapsedSeconds = elapsedSeconds ?? session.elapsedSeconds;
  session.lastActivityAt = new Date();
  await session.save();

  const ranking = await buildRankingForSession(session._id);

  emitSessionEvent(session, 'interview:completed', {
    status: session.status,
    runningScore: session.runningScore,
    finalReport: session.finalReport
  });
  emitSessionEvent(session, 'report:generated', {
    finalReport: session.finalReport,
    ranking
  });

  return { session, ranking };
};

export const getDashboard = asyncHandler(async (req, res) => {
  const sessions = await InterviewSession.find({ candidate: req.user._id })
    .populate('interview')
    .sort({ updatedAt: -1 })
    .lean();

  res.json({
    sessions: sessions.map((session) =>
      serializeSession(session, session.interview, session.status === 'completed' || session.interview?.settings?.showEvaluationToCandidate)
    )
  });
});

export const getInvite = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ inviteCode: req.params.code.toUpperCase(), status: 'open' })
    .select('title role experienceLevel difficulty interviewType numberOfQuestions inviteCode settings createdAt')
    .lean();

  if (!interview) {
    throw new AppError('Invite code is invalid or closed.', 404);
  }

  res.json({ interview });
});

export const joinByCode = asyncHandler(async (req, res) => {
  const inviteCode = String(req.body.inviteCode || '').trim().toUpperCase();
  const interview = await Interview.findOne({ inviteCode, status: 'open' });

  if (!interview) {
    throw new AppError('Invite code is invalid or closed.', 404);
  }

  const candidateProfile = await getCandidateProfile(req.user._id);
  let session = await InterviewSession.findOne({ interview: interview._id, candidate: req.user._id });

  if (!session) {
    session = await InterviewSession.create({
      interview: interview._id,
      recruiter: interview.recruiter,
      candidate: req.user._id,
      candidateProfile: candidateProfile._id,
      questions: interview.questionSet,
      currentQuestionIndex: 0,
      status: 'waiting'
    });
  }

  emitSessionEvent(session, 'candidate:joined', {
    status: session.status,
    candidate: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    },
    at: new Date().toISOString()
  });

  res.status(session.createdAt?.getTime() === session.updatedAt?.getTime() ? 201 : 200).json({
    session: serializeSession(session, interview, interview.settings?.showEvaluationToCandidate)
  });
});

export const getSession = asyncHandler(async (req, res) => {
  const { session, interview } = await loadCandidateSession(req.params.sessionId, req.user._id);
  const includeFeedback = session.status === 'completed' || interview.settings?.showEvaluationToCandidate;

  res.json({ session: serializeSession(session, interview, includeFeedback) });
});

export const startSession = asyncHandler(async (req, res) => {
  const { session, interview } = await loadCandidateSession(req.params.sessionId, req.user._id);

  if (session.status === 'completed') {
    throw new AppError('This interview is already completed.', 409);
  }

  session.status = 'live';
  session.startedAt ||= new Date();
  session.currentQuestionStartedAt = new Date();
  session.lastActivityAt = new Date();
  await session.save();

  const currentQuestion = serializeQuestion(session.questions[session.currentQuestionIndex]);

  emitSessionEvent(session, 'ai:question', {
    question: currentQuestion,
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions: session.questions.length,
    status: session.status
  });

  res.json({ session: serializeSession(session, interview, interview.settings?.showEvaluationToCandidate) });
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const { transcript, mode = 'voice', durationSeconds = 0 } = req.body;
  const { session, interview } = await loadCandidateSession(req.params.sessionId, req.user._id);

  if (session.status === 'completed') {
    throw new AppError('This interview is already completed.', 409);
  }

  if (session.status === 'waiting') {
    session.status = 'live';
    session.startedAt ||= new Date();
  }

  const question = session.questions[session.currentQuestionIndex];
  if (!question) {
    throw new AppError('No active question is available.', 409);
  }

  const cleanTranscript = String(transcript || '').trim();
  if (!cleanTranscript) {
    throw new AppError('Transcript is required.', 422);
  }

  emitSessionEvent(session, 'candidate:answer_submitted', {
    question: serializeQuestion(question),
    transcript: cleanTranscript,
    mode,
    at: new Date().toISOString()
  });

  const feedback = await evaluateAnswer({
    role: interview.role,
    experienceLevel: interview.experienceLevel,
    difficulty: question.difficulty || interview.difficulty,
    question: question.question,
    expectedAnswer: question.answer,
    transcript: cleanTranscript
  });

  session.answers.push({
    questionId: question.id,
    question: question.question,
    expectedAnswer: question.answer,
    transcript: cleanTranscript,
    mode,
    durationSeconds,
    feedback,
    evaluatedAt: new Date()
  });

  const answer = session.answers[session.answers.length - 1];
  await Evaluation.create({
    interview: interview._id,
    session: session._id,
    recruiter: session.recruiter,
    candidate: session.candidate,
    answerId: answer._id,
    questionId: question.id,
    feedback
  });

  session.currentQuestionIndex = Math.min(session.currentQuestionIndex + 1, session.questions.length);
  session.liveTranscript = '';
  session.runningScore = calculateRunningScore(session.answers, interview.scoringCriteria);
  session.lastActivityAt = new Date();
  await session.save();

  emitSessionEvent(session, 'ai:evaluation_completed', {
    answer,
    feedback,
    runningScore: session.runningScore,
    currentQuestionIndex: session.currentQuestionIndex
  });
  emitSessionEvent(session, 'score:update', {
    runningScore: session.runningScore
  });

  const isComplete = session.currentQuestionIndex >= session.questions.length;
  let ranking = null;

  if (isComplete) {
    const result = await finalizeSession({ session, interview, elapsedSeconds: req.body.elapsedSeconds });
    ranking = result.ranking;
  } else {
    emitSessionEvent(session, 'ai:question', {
      question: serializeQuestion(session.questions[session.currentQuestionIndex]),
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.questions.length,
      status: session.status
    });
  }

  const includeFeedback = session.status === 'completed' || interview.settings?.showEvaluationToCandidate;

  res.json({
    session: serializeSession(session, interview, includeFeedback),
    answer: serializeAnswerForCandidate(answer, includeFeedback),
    nextQuestion: serializeQuestion(session.questions[session.currentQuestionIndex]),
    isComplete,
    ranking
  });
});

export const completeSession = asyncHandler(async (req, res) => {
  const { session, interview } = await loadCandidateSession(req.params.sessionId, req.user._id);

  if (session.status === 'completed') {
    return res.json({
      session: serializeSession(session, interview, true)
    });
  }

  if ((session.answers || []).length < session.questions.length) {
    throw new AppError('All questions must be answered before completing the interview.', 409);
  }

  const result = await finalizeSession({ session, interview, elapsedSeconds: req.body.elapsedSeconds });

  return res.json({
    session: serializeSession(result.session, interview, true),
    ranking: result.ranking
  });
});
