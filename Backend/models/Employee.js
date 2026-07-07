import mongoose from 'mongoose';

const { Schema } = mongoose;

const EmployeeSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    role: { type: String, required: true },
    department: { type: String },
    employeeId: { type: String, required: true, unique: true },
    joiningDate: { type: Date },
    reportingManager: { type: Schema.Types.ObjectId, ref: 'User' },
    fromCandidate: { type: Schema.Types.ObjectId, ref: 'Candidate' }
  },
  { timestamps: true }
);

export default mongoose.model('Employee', EmployeeSchema);
