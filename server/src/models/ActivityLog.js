import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true }, // e.g. DRAFT_SAVED, CLAIM_SUBMITTED, CLAIM_APPROVED, CLAIM_RETURNED, CLAIM_REIMBURSED, CLAIM_REJECTED
    claimId: { type: String, required: true },
    details: { type: String },
    amount: { type: Number },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure JSON serialization returns virtuals/id properly
ActivityLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
