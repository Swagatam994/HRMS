import mongoose from 'mongoose';

const { Schema } = mongoose;

const OnboardingTaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    role: { type: String },
    mandatory: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
    session: { type: Schema.Types.ObjectId, ref: 'OnboardingSession' }
  },
  { timestamps: true }
);

export default mongoose.model('OnboardingTask', OnboardingTaskSchema);
