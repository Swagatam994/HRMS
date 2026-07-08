import mongoose from 'mongoose';

const { Schema } = mongoose;

const PayrollRecordSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: String, required: true },
    grossSalary: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'processed', 'paid'], default: 'processed' },
    payslipUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('PayrollRecord', PayrollRecordSchema);
