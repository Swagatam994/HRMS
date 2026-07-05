import { Interview } from '../models/Interview.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { average } from '../utils/reportUtils.js';

const buildStats = async (userId) => {
  const interviews = await Interview.find({ user: userId }).select('finalReport status').lean();
  const scores = interviews
    .map((interview) => Number(interview.finalReport?.overallScore || 0))
    .filter((score) => score > 0);

  return {
    totalInterviews: interviews.length,
    completedInterviews: interviews.filter((interview) => interview.status === 'completed').length,
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
  const allowed = ['name', 'title', 'location', 'bio', 'avatarUrl'];
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
