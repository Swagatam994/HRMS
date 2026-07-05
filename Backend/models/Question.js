import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, index: true },
    category: { type: String, default: 'general', index: true },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
    interviewType: { type: String, enum: ['Technical', 'HR', 'Behavioral', 'Mixed'], default: 'Technical' },
    question: { type: String, required: true },
    answer: { type: String, default: '' },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

export const Question = mongoose.model('Question', questionSchema);
