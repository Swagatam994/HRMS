import { CandidateRanking } from '../models/CandidateRanking.js';
import { Interview } from '../models/Interview.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { average, clampScore } from '../utils/reportUtils.js';

const weightedOverall = (scores, criteria = {}) => {
  const technicalWeight = Number(criteria.technicalWeight ?? 0.5);
  const communicationWeight = Number(criteria.communicationWeight ?? 0.25);
  const problemSolvingWeight = Number(criteria.problemSolvingWeight ?? 0.25);
  const totalWeight = technicalWeight + communicationWeight + problemSolvingWeight || 1;

  return clampScore(
    (scores.technicalScore * technicalWeight +
      scores.communicationScore * communicationWeight +
      scores.problemSolvingScore * problemSolvingWeight) /
      totalWeight
  );
};

export const calculateRunningScore = (answers = [], criteria = {}) => {
  const scoredAnswers = answers.filter((answer) => answer?.feedback?.score);

  if (!scoredAnswers.length) {
    return {
      technicalScore: 0,
      communicationScore: 0,
      problemSolvingScore: 0,
      overallScore: 0
    };
  }

  const technicalScore = average(scoredAnswers.map((answer) => answer.feedback.score.technicalAccuracy));
  const communicationScore = average(scoredAnswers.map((answer) => answer.feedback.score.communication));
  const problemSolvingScore = average(
    scoredAnswers.map((answer) => average([answer.feedback.score.completeness, answer.feedback.score.confidence]))
  );

  return {
    technicalScore,
    communicationScore,
    problemSolvingScore,
    overallScore: weightedOverall({ technicalScore, communicationScore, problemSolvingScore }, criteria)
  };
};

export const recommendFromScore = (score = 0, criteria = {}) => {
  if (score >= Number(criteria.strongHireScore ?? 8.5)) return 'Strong Hire';
  if (score >= Number(criteria.hireScore ?? 7)) return 'Hire';
  if (score >= Number(criteria.considerScore ?? 5.5)) return 'Consider';
  return 'Reject';
};

export const buildRankingForSession = async (sessionId) => {
  const session = await InterviewSession.findById(sessionId)
    .populate('candidate', 'name email')
    .populate('interview')
    .lean();

  if (!session || !session.interview || session.status !== 'completed') return null;

  const interview = session.interview;
  const scores = calculateRunningScore(session.answers || [], interview.scoringCriteria || {});
  const recommendation = recommendFromScore(scores.overallScore, interview.scoringCriteria || {});

  const ranking = await CandidateRanking.findOneAndUpdate(
    { session: session._id },
    {
      interview: interview._id,
      session: session._id,
      recruiter: session.recruiter,
      candidate: session.candidate?._id || session.candidate,
      candidateName: session.candidate?.name || 'Candidate',
      candidateEmail: session.candidate?.email || '',
      roleApplied: interview.role,
      scores,
      overallScore: scores.overallScore,
      recommendation,
      interviewDate: session.endedAt || session.updatedAt || new Date()
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await rerankInterview(interview._id);
  return ranking;
};

export const rerankInterview = async (interviewId) => {
  const rankings = await CandidateRanking.find({ interview: interviewId }).sort({ overallScore: -1, interviewDate: 1 });

  await Promise.all(
    rankings.map((ranking, index) => {
      ranking.rank = index + 1;
      return ranking.save();
    })
  );

  await Interview.findByIdAndUpdate(interviewId, { finalRankingGeneratedAt: new Date() });
  return CandidateRanking.find({ interview: interviewId }).sort({ rank: 1 }).lean();
};
