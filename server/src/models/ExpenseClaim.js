import mongoose from 'mongoose';

const OcrConfidenceSchema = new mongoose.Schema({
  merchant: { type: Number },
  invoiceNumber: { type: Number },
  amount: { type: Number },
  tax: { type: Number },
  date: { type: Number },
  category: { type: Number }
}, { _id: false });

const ExpenseClaimSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Custom readable ID like EXP-timestamp or EXP-seq
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, required: true, enum: ['Draft', 'Submitted', 'Returned', 'Approved', 'Reimbursed', 'Rejected'] },
  amount: { type: Number, required: true },
  invoiceDate: { type: Date, required: true },
  submissionDate: { type: Date },
  merchant: { type: String },
  invoiceNumber: { type: String },
  currency: { type: String, default: 'INR' },
  tax: { type: Number },
  category: { type: String },
  department: { type: String },
  costCenter: { type: String },
  projectCode: { type: String },
  expenseType: { type: String, default: 'Reimbursable' },
  description: { type: String },
  receiptUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  fileSize: { type: Number },
  ocrOverallScore: { type: Number },
  ocrTimestamp: { type: Date },
  ocrConfidence: { type: OcrConfidenceSchema },
  employeeNotes: { type: String },
  managerComments: { type: String },
  financeComments: { type: String },
  oracleRefId: { type: String }, // Populated when disbursed and synced
  history: [
    {
      action: { type: String, required: true },
      user: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// Ensure JSON serialization returns virtuals/id properly if needed
ExpenseClaimSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ExpenseClaim = mongoose.model('ExpenseClaim', ExpenseClaimSchema);
