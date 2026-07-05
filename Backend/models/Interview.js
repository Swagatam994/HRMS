import mongoose from 'mongoose';
import { answerSchema } from './Answer.js';

const questionSnapshotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, default: '' },
    difficulty: { type: String, default: 'Intermediate' },
    type: { type: String, default: 'Technical' },
    tags: [{ type: String }]
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
    generatedAt: { type: Date }
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    difficulty: { type: String, required: true },
    interviewType: { type: String, required: true },
    numberOfQuestions: { type: Number, min: 1, max: 20, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'paused', 'completed'],
      default: 'in_progress',
      index: true
    },
    questions: [questionSnapshotSchema],
    answers: [answerSchema],
    currentQuestionIndex: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    pausedAt: { type: Date },
    endedAt: { type: Date },
    elapsedSeconds: { type: Number, default: 0 },
    finalReport: { type: finalReportSchema, default: () => ({}) }
  },
  { timestamps: true }
);

interviewSchema.index({ user: 1, createdAt: -1 });

export const Interview = mongoose.model('Interview', interviewSchema);
