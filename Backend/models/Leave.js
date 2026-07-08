import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    type: {
      type: String,
      enum: ['sick', 'casual', 'annual', 'unpaid', 'maternity', 'paternity', 'other'],
      default: 'casual',
      index: true
    },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    days: { type: Number, min: 0, default: 1 }
  },
  { timestamps: true }
);

export const Leave = mongoose.model('Leave', leaveSchema);
