import dotenv from 'dotenv';

// Load variables from .env
dotenv.config();
console.log("dotenv result:", dotenv.config());
console.log("cwd:", process.cwd());
console.log("Gemini:", process.env.GEMINI_API_KEY);
const requiredEnvVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`[CRITICAL] Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY,
};
