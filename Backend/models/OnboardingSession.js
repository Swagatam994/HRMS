import mongoose from 'mongoose';

const { Schema } = mongoose;

const OnboardingSessionSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'OnboardingTask' }],
    startedAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('OnboardingSession', OnboardingSessionSchema);
