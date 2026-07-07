import mongoose from 'mongoose';
import { runningScoreSchema } from './InterviewSession.js';

const candidateRankingSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true, unique: true, index: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidateName: { type: String, required: true, trim: true },
    candidateEmail: { type: String, required: true, trim: true },
    roleApplied: { type: String, required: true, trim: true },
    scores: { type: runningScoreSchema, default: () => ({}) },
    overallScore: { type: Number, min: 0, max: 10, default: 0, index: true },
    recommendation: {
      type: String,
      enum: ['Strong Hire', 'Hire', 'Consider', 'Reject', 'Pending', 'Hired'],
      default: 'Pending',
      index: true
    },
    rank: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Shortlisted', 'Rejected', 'On Hold', 'Hired'],
      default: 'Pending',
      index: true
    },
    interviewDate: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

candidateRankingSchema.index({ interview: 1, overallScore: -1 });

export const CandidateRanking = mongoose.model('CandidateRanking', candidateRankingSchema);
