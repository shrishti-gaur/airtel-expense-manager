import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // custom notification id
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' }
}, { timestamps: true });

// Ensure JSON serialization returns virtuals/id properly
NotificationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Notification = mongoose.model('Notification', NotificationSchema);
