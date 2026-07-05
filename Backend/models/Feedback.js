import mongoose from 'mongoose';
import { scoreSchema } from './Score.js';

export const feedbackSchema = new mongoose.Schema(
  {
    score: { type: scoreSchema, default: () => ({}) },
    idealAnswer: { type: String, default: '' },
    mistakes: [{ type: String }],
    suggestions: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendedTopics: [{ type: String }],
    difficultyLevel: { type: String, default: 'Medium' },
    raw: { type: mongoose.Schema.Types.Mixed }
  },
  { _id: false }
);
