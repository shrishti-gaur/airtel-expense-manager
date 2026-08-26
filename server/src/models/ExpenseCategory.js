import mongoose from 'mongoose';

const ExpenseCategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    group: { type: String, required: true },
    subcategories: [{ type: String }],
    aliases: [{ type: String }],
  },
  { timestamps: true }
);

// Ensure JSON serialization returns virtuals/id properly
ExpenseCategorySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ExpenseCategory = mongoose.model('ExpenseCategory', ExpenseCategorySchema);
