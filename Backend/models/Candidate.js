import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    currentRole: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    resumeUrl: { type: String, trim: true, default: '' },
    source: { type: String, trim: true, default: 'direct' }
  },
  { timestamps: true }
);

export const Candidate = mongoose.model('Candidate', candidateSchema);
