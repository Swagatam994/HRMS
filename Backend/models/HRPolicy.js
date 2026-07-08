import mongoose from 'mongoose';

const { Schema } = mongoose;

const HrPolicySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, default: 'General' },
    content: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model('HRPolicy', HrPolicySchema);
