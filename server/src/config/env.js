import dotenv from 'dotenv';
import { execSync } from 'child_process';

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

// Auto-detect Tesseract path if TESSERACT_PATH is not provided
let tesseractPath = process.env.TESSERACT_PATH;
if (!tesseractPath) {
  try {
    const whichPath = execSync('which tesseract', { encoding: 'utf8' }).trim();
    if (whichPath) {
      tesseractPath = whichPath;
    }
  } catch (err) {
    tesseractPath = 'tesseract';
  }
}

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY,
  tesseractPath,
  tessdataPrefix: process.env.TESSDATA_PREFIX || undefined,
  ocrLang: process.env.OCR_LANG || 'eng+hin',
};
