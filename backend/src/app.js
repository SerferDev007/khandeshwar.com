import express from 'express';
import helmet from 'helmet';
import pino from 'pino';
import pinoPretty from 'pino-pretty';
import env from './config/env.js';
import corsMiddleware from './middleware/cors.js';
import { defaultRateLimit } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler, handleUncaughtException, handleUnhandledRejection } from './middleware/error.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import fileRoutes from './routes/files.js';

// Create logger
const logger = pino(
  env.NODE_ENV === 'development'
    ? pinoPretty({
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
        colorize: true,
      })
    : {}
);

// Global error handlers
process.on('uncaughtException', handleUncaughtException);
process.on('unhandledRejection', handleUnhandledRejection);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS
app.use(corsMiddleware);

// Rate limiting
app.use(defaultRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, 'Incoming request');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: env.NODE_ENV,
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;