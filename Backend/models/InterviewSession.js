import mongoose from 'mongoose';
import { answerSchema } from './Answer.js';
import { questionSnapshotSchema } from './Interview.js';

export const runningScoreSchema = new mongoose.Schema(
  {
    technicalScore: { type: Number, min: 0, max: 10, default: 0 },
    communicationScore: { type: Number, min: 0, max: 10, default: 0 },
    problemSolvingScore: { type: Number, min: 0, max: 10, default: 0 },
    overallScore: { type: Number, min: 0, max: 10, default: 0 }
  },
  { _id: false }
);

const finalReportSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, min: 0, max: 10, default: 0 },
    summary: { type: String, default: '' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendedTopics: [{ type: String }],
    recommendation: {
      type: String,
      enum: ['Strong Hire', 'Hire', 'Consider', 'Reject', 'Pending'],
      default: 'Pending'
    },
    generatedAt: { type: Date }
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidateProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    status: {
      type: String,
      enum: ['waiting', 'live', 'completed', 'cancelled'],
      default: 'waiting',
      index: true
    },
    questions: [questionSnapshotSchema],
    answers: [answerSchema],
    currentQuestionIndex: { type: Number, default: 0 },
    currentQuestionStartedAt: { type: Date },
    liveTranscript: { type: String, default: '' },
    runningScore: { type: runningScoreSchema, default: () => ({}) },
    startedAt: { type: Date },
    endedAt: { type: Date },
    elapsedSeconds: { type: Number, default: 0 },
    finalReport: { type: finalReportSchema, default: () => ({}) },
    lastActivityAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

interviewSessionSchema.index({ interview: 1, candidate: 1 }, { unique: true });
interviewSessionSchema.index({ recruiter: 1, status: 1, updatedAt: -1 });

export const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
