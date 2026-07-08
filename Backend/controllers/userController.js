import { Interview } from '../models/Interview.js';
import { CandidateRanking } from '../models/CandidateRanking.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { average } from '../utils/reportUtils.js';

const buildStats = async (userId) => {
  const user = await User.findById(userId).select('role').lean();

  if (user?.role === 'recruiter') {
    const [interviews, sessions, rankings] = await Promise.all([
      Interview.find({ recruiter: userId }).select('status').lean(),
      InterviewSession.find({ recruiter: userId }).select('status').lean(),
      CandidateRanking.find({ recruiter: userId }).select('overallScore').lean()
    ]);

    const scores = rankings.map((ranking) => ranking.overallScore).filter((score) => score > 0);

    return {
      totalInterviews: interviews.length,
      activeInterviews: interviews.filter((interview) => interview.status === 'open').length,
      waitingCandidates: sessions.filter((session) => session.status === 'waiting').length,
      liveInterviews: sessions.filter((session) => session.status === 'live').length,
      completedInterviews: sessions.filter((session) => session.status === 'completed').length,
      averageScore: average(scores),
      highestScore: scores.length ? Math.max(...scores) : 0
    };
  }

  const sessions = await InterviewSession.find({ candidate: userId }).select('finalReport status runningScore').lean();
  const scores = sessions
    .map((session) => Number(session.finalReport?.overallScore || session.runningScore?.overallScore || 0))
    .filter((score) => score > 0);

  return {
    totalInterviews: sessions.length,
    completedInterviews: sessions.filter((session) => session.status === 'completed').length,
    averageScore: average(scores),
    highestScore: scores.length ? Math.max(...scores) : 0
  };
};

export const getProfile = asyncHandler(async (req, res) => {
  res.json({
    user: req.user.toSafeJSON(),
    stats: await buildStats(req.user._id)
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'title', 'organization', 'location', 'bio', 'avatarUrl'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  await req.user.save();

  res.json({
    user: req.user.toSafeJSON(),
    stats: await buildStats(req.user._id)
  });
});
