import mongoose from 'mongoose';

const recruiterSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    companyName: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: 'Recruiting' },
    defaultScoringCriteria: {
      strongHireScore: { type: Number, min: 0, max: 10, default: 8.5 },
      hireScore: { type: Number, min: 0, max: 10, default: 7 },
      considerScore: { type: Number, min: 0, max: 10, default: 5.5 },
      technicalWeight: { type: Number, min: 0, max: 1, default: 0.5 },
      communicationWeight: { type: Number, min: 0, max: 1, default: 0.25 },
      problemSolvingWeight: { type: Number, min: 0, max: 1, default: 0.25 }
    }
  },
  { timestamps: true }
);

export const Recruiter = mongoose.model('Recruiter', recruiterSchema);
