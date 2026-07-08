import mongoose from 'mongoose';

const { Schema } = mongoose;

const EmployeeDocumentSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: { type: String, required: true },
    filename: { type: String },
    contentHtml: { type: String },
    pdfPath: { type: String },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('EmployeeDocument', EmployeeDocumentSchema);
