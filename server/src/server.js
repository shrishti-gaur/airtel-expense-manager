import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config and services
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

// Middlewares
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import managerRoutes from './routes/manager.routes.js';
import financeRoutes from './routes/finance.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import ocrRoutes from './routes/ocr.routes.js';
import aiRoutes from './routes/ai.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// 1. Establish Database Connection
connectDB();

// 2. Global Security and Utility Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin: '*', // TODO: Restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Standard Dev Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 3. API Versioning (/api/v1)
const apiPrefix = '/api/v1';

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/expense`, expenseRoutes);
app.use(`${apiPrefix}/manager`, managerRoutes);
app.use(`${apiPrefix}/finance`, financeRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/ocr`, ocrRoutes);
app.use(`${apiPrefix}/ai`, aiRoutes);
app.use(`${apiPrefix}/notification`, notificationRoutes);

// Base Status Route
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    message: 'Enterprise Expense Management System API Service',
    version: '1.0.0',
    endpoints: `${apiPrefix}/...`,
  });
});

// Catch-all 404 Route
app.use((req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  error.status = 404;
  error.code = 'NOT_FOUND';
  next(error);
});

// 4. Centralized Error Handler Middleware
app.use(errorHandler);

// 5. Spin up listener
const server = app.listen(config.port, () => {
  console.log(`[Server] running in [${config.nodeEnv}] mode on port: ${config.port}`);
  
  // Log Tesseract version to verify installation
  execFile(config.tesseractPath, ['--version'], (err, stdout, stderr) => {
    if (err) {
      console.error(`[Server] [OCR Init Warning] Failed to detect Tesseract executable at path: ${config.tesseractPath}. Error: ${err.message}`);
    } else {
      const firstLine = stdout.split('\n')[0] || '';
      console.log(`[Server] [OCR Init] Tesseract detected successfully: ${firstLine}`);
    }
  });
});

export default server;
