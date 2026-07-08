import mongoose from 'mongoose';

export const scoreSchema = new mongoose.Schema(
  {
    technicalAccuracy: { type: Number, min: 0, max: 10, default: 0 },
    communication: { type: Number, min: 0, max: 10, default: 0 },
    completeness: { type: Number, min: 0, max: 10, default: 0 },
    confidence: { type: Number, min: 0, max: 10, default: 0 },
    overall: { type: Number, min: 0, max: 10, default: 0 }
  },
  { _id: false }
);
