import mongoose from 'mongoose';

export const questionSnapshotSchema = new mongoose.Schema(
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

const scoringCriteriaSchema = new mongoose.Schema(
  {
    strongHireScore: { type: Number, min: 0, max: 10, default: 8.5 },
    hireScore: { type: Number, min: 0, max: 10, default: 7 },
    considerScore: { type: Number, min: 0, max: 10, default: 5.5 },
    technicalWeight: { type: Number, min: 0, max: 1, default: 0.5 },
    communicationWeight: { type: Number, min: 0, max: 1, default: 0.25 },
    problemSolvingWeight: { type: Number, min: 0, max: 1, default: 0.25 }
  },
  { _id: false }
);

const interviewSettingsSchema = new mongoose.Schema(
  {
    allowVoice: { type: Boolean, default: true },
    allowText: { type: Boolean, default: true },
    showEvaluationToCandidate: { type: Boolean, default: false },
    autoShortlist: { type: Boolean, default: true }
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recruiterProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' },
    title: { type: String, trim: true, required: true },
    role: { type: String, required: true, trim: true, index: true },
    experienceLevel: { type: String, required: true },
    difficulty: { type: String, required: true },
    interviewType: { type: String, required: true },
    numberOfQuestions: { type: Number, min: 1, max: 20, required: true },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'completed'],
      default: 'open',
      index: true
    },
    inviteCode: { type: String, required: true, unique: true, index: true },
    questionSet: [questionSnapshotSchema],
    scoringCriteria: { type: scoringCriteriaSchema, default: () => ({}) },
    settings: { type: interviewSettingsSchema, default: () => ({}) },
    finalRankingGeneratedAt: { type: Date }
  },
  { timestamps: true }
);

interviewSchema.index({ recruiter: 1, createdAt: -1 });
interviewSchema.index({ recruiter: 1, role: 1, status: 1 });

export const Interview = mongoose.model('Interview', interviewSchema);
