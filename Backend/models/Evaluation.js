import mongoose from 'mongoose';
import { feedbackSchema } from './Feedback.js';

const evaluationSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true, index: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answerId: { type: mongoose.Schema.Types.ObjectId },
    questionId: { type: String, required: true },
    feedback: { type: feedbackSchema, default: () => ({}) },
    evaluatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

evaluationSchema.index({ session: 1, questionId: 1 });

export const Evaluation = mongoose.model('Evaluation', evaluationSchema);
