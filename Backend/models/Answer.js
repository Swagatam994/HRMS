import mongoose from 'mongoose';
import { feedbackSchema } from './Feedback.js';

export const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    expectedAnswer: { type: String, default: '' },
    transcript: { type: String, required: true },
    mode: { type: String, enum: ['voice', 'typing', 'text'], default: 'voice' },
    durationSeconds: { type: Number, default: 0 },
    feedback: { type: feedbackSchema, default: () => ({}) },
    evaluatedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);
