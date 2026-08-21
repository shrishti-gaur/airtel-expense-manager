import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['Employee', 'Manager', 'Finance'] },
    email: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    costCenter: { type: String, required: true },
    passwordHash: { type: String },
    allowedCategories: [{ type: String }],
  },
  { timestamps: true }
);

export const Employee = mongoose.model('Employee', EmployeeSchema);
