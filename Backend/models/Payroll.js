import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12, index: true },
    year: { type: Number, required: true, index: true },
    baseSalary: { type: Number, min: 0, required: true },
    allowances: { type: Number, min: 0, default: 0 },
    deductions: { type: Number, min: 0, default: 0 },
    netSalary: { type: Number, min: 0, required: true },
    status: {
      type: String,
      enum: ['pending', 'processed', 'paid'],
      default: 'processed',
      index: true
    },
    department: { type: String, trim: true, default: '' },
    processedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export const Payroll = mongoose.model('Payroll', payrollSchema);
