import { CandidateRanking } from '../models/CandidateRanking.js';
import { Interview } from '../models/Interview.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { Recruiter } from '../models/Recruiter.js';
import { User } from '../models/User.js';
import { getQuestionsByRole } from '../services/questionService.js';
import { rerankInterview } from '../services/rankingService.js';
import { emitToRecruiter } from '../services/socketService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { average } from '../utils/reportUtils.js';
import { createEmployeeFromUser } from './employeeController.js';

const makeInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const createInviteCode = async () => {
  for (let index = 0; index < 8; index += 1) {
    const inviteCode = makeInviteCode();
    const exists = await Interview.exists({ inviteCode });
    if (!exists) return inviteCode;
  }
  throw new AppError('Unable to generate a unique invite code.', 500);
};

const normalizeCriteria = (criteria = {}) => ({
  strongHireScore: Number(criteria.strongHireScore ?? 8.5),
  hireScore: Number(criteria.hireScore ?? 7),
  considerScore: Number(criteria.considerScore ?? 5.5),
  technicalWeight: Number(criteria.technicalWeight ?? 0.5),
  communicationWeight: Number(criteria.communicationWeight ?? 0.25),
  problemSolvingWeight: Number(criteria.problemSolvingWeight ?? 0.25)
});

const serializeInterview = (interview, counts = {}) => ({
  id: String(interview._id),
  _id: String(interview._id),
  title: interview.title,
  role: interview.role,
  experienceLevel: interview.experienceLevel,
  difficulty: interview.difficulty,
  interviewType: interview.interviewType,
  numberOfQuestions: interview.numberOfQuestions,
  status: interview.status,
  inviteCode: interview.inviteCode,
  scoringCriteria: interview.scoringCriteria,
  settings: interview.settings,
  createdAt: interview.createdAt,
  updatedAt: interview.updatedAt,
  finalRankingGeneratedAt: interview.finalRankingGeneratedAt,
  counts: {
    waiting: counts.waiting || 0,
    live: counts.live || 0,
    completed: counts.completed || 0,
    total: counts.total || 0
  }
});

const serializeSession = (session) => ({
  id: String(session._id),
  _id: String(session._id),
  interview: session.interview,
  recruiter: session.recruiter,
  candidate: session.candidate,
  status: session.status,
  questions: session.questions || [],
  answers: session.answers || [],
  currentQuestionIndex: session.currentQuestionIndex || 0,
  currentQuestion: session.questions?.[session.currentQuestionIndex] || null,
  liveTranscript: session.liveTranscript || '',
  runningScore: session.runningScore || {},
  startedAt: session.startedAt,
  endedAt: session.endedAt,
  elapsedSeconds: session.elapsedSeconds || 0,
  finalReport: session.finalReport || {},
  lastActivityAt: session.lastActivityAt,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt
});

const countSessionsByInterview = (sessions = []) =>
  sessions.reduce((acc, session) => {
    const key = String(session.interview?._id || session.interview);
    acc[key] ||= { waiting: 0, live: 0, completed: 0, total: 0 };
    acc[key].total += 1;
    if (acc[key][session.status] !== undefined) acc[key][session.status] += 1;
    return acc;
  }, {});

export const createInterview = asyncHandler(async (req, res) => {
  const {
    title,
    role,
    experienceLevel,
    difficulty,
    numberOfQuestions,
    interviewType,
    scoringCriteria,
    settings
  } = req.body;

  const recruiterProfile = await Recruiter.findOneAndUpdate(
    { user: req.user._id },
    { user: req.user._id, companyName: req.user.organization || '' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const bank = await getQuestionsByRole(role, {
    difficulty,
    interviewType,
    numberOfQuestions
  });

  if (!bank.questions.length) {
    throw new AppError('No questions available for the selected interview setup.', 404);
  }

  const interview = await Interview.create({
    recruiter: req.user._id,
    recruiterProfile: recruiterProfile._id,
    title: title || `${bank.role} Interview`,
    role: bank.role,
    experienceLevel,
    difficulty,
    interviewType,
    numberOfQuestions: bank.questions.length,
    questionSet: bank.questions,
    inviteCode: await createInviteCode(),
    scoringCriteria: normalizeCriteria(scoringCriteria || recruiterProfile.defaultScoringCriteria),
    settings: {
      allowVoice: settings?.allowVoice ?? true,
      allowText: settings?.allowText ?? true,
      showEvaluationToCandidate: settings?.showEvaluationToCandidate ?? false,
      autoShortlist: settings?.autoShortlist ?? true
    }
  });

  emitToRecruiter(req.user._id, 'interview:created', { interview: serializeInterview(interview) });

  res.status(201).json({ interview: serializeInterview(interview) });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const [interviews, sessions, rankings] = await Promise.all([
    Interview.find({ recruiter: req.user._id }).sort({ createdAt: -1 }).lean(),
    InterviewSession.find({ recruiter: req.user._id })
      .populate('candidate', 'name email')
      .populate('interview', 'title role inviteCode')
      .sort({ updatedAt: -1 })
      .limit(40)
      .lean(),
    CandidateRanking.find({ recruiter: req.user._id }).sort({ overallScore: -1 }).limit(8).lean()
  ]);

  const scores = rankings.map((ranking) => ranking.overallScore).filter((score) => score > 0);
  const counts = countSessionsByInterview(sessions);

  res.json({
    metrics: {
      activeInterviews: interviews.filter((interview) => interview.status === 'open').length,
      waitingCandidates: sessions.filter((session) => session.status === 'waiting').length,
      liveInterviews: sessions.filter((session) => session.status === 'live').length,
      completedInterviews: sessions.filter((session) => session.status === 'completed').length,
      averageScore: average(scores)
    },
    interviews: interviews.slice(0, 8).map((interview) => serializeInterview(interview, counts[String(interview._id)])),
    activeSessions: sessions.map(serializeSession),
    topCandidates: rankings
  });
});

export const listInterviews = asyncHandler(async (req, res) => {
  const [interviews, sessions] = await Promise.all([
    Interview.find({ recruiter: req.user._id }).sort({ createdAt: -1 }).lean(),
    InterviewSession.find({ recruiter: req.user._id }).select('interview status').lean()
  ]);
  const counts = countSessionsByInterview(sessions);

  res.json({
    interviews: interviews.map((interview) => serializeInterview(interview, counts[String(interview._id)]))
  });
});

export const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, recruiter: req.user._id }).lean();

  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  const [sessions, rankings] = await Promise.all([
    InterviewSession.find({ interview: interview._id, recruiter: req.user._id })
      .populate('candidate', 'name email')
      .sort({ updatedAt: -1 })
      .lean(),
    CandidateRanking.find({ interview: interview._id, recruiter: req.user._id }).sort({ rank: 1, overallScore: -1 }).lean()
  ]);

  const counts = countSessionsByInterview(sessions);

  res.json({
    interview: serializeInterview(interview, counts[String(interview._id)]),
    sessions: sessions.map(serializeSession),
    rankings
  });
});

export const updateInterview = asyncHandler(async (req, res) => {
  const allowed = ['title', 'status', 'settings', 'scoringCriteria'];
  const updates = {};

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (updates.scoringCriteria) updates.scoringCriteria = normalizeCriteria(updates.scoringCriteria);

  const interview = await Interview.findOneAndUpdate({ _id: req.params.id, recruiter: req.user._id }, updates, {
    new: true,
    runValidators: true
  });

  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  res.json({ interview: serializeInterview(interview) });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({ _id: req.params.sessionId, recruiter: req.user._id })
    .populate('candidate', 'name email')
    .populate('interview')
    .lean();

  if (!session) {
    throw new AppError('Session not found.', 404);
  }

  res.json({ session: serializeSession(session) });
});

export const getRankings = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, recruiter: req.user._id }).select('_id').lean();
  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  const sortKey = req.query.sort || 'rank';
  const sortMap = {
    overallScore: { overallScore: -1 },
    technicalScore: { 'scores.technicalScore': -1 },
    communicationScore: { 'scores.communicationScore': -1 },
    interviewDate: { interviewDate: -1 },
    status: { status: 1 },
    rank: { rank: 1 }
  };
  const filter = { interview: interview._id, recruiter: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const rankings = await CandidateRanking.find(filter).sort(sortMap[sortKey] || sortMap.rank).lean();
  res.json({ rankings });
});

export const updateCandidateStatus = asyncHandler(async (req, res) => {
  const ranking = await CandidateRanking.findOneAndUpdate(
    { _id: req.params.rankingId, recruiter: req.user._id },
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!ranking) {
    throw new AppError('Candidate ranking not found.', 404);
  }

  if (['Hired', 'Hire'].includes(req.body.status)) {
    const user = await User.findById(ranking.candidate);
    if (user) {
      await createEmployeeFromUser({
        user,
        role: ranking.roleApplied,
        department: user.organization || '',
        joiningDate: req.body.joiningDate,
        reportingManager: req.body.reportingManager || null,
        candidateId: null
      });
    }
  }

  await rerankInterview(ranking.interview);
  emitToRecruiter(req.user._id, 'candidate:status_updated', { ranking });

  res.json({ ranking });
});
