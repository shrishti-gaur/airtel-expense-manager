import mongoose from 'mongoose';
import { config } from './env.js';
import { seedDB } from './seed.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    
    // Seed initial database values
    await seedDB();
  } catch (error) {
    console.error(`[Database] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown listener
mongoose.connection.on('disconnected', () => {
  console.log('[Database] MongoDB connection disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('[Database] MongoDB connection closed through app termination');
  process.exit(0);
});
