import cors from 'cors';
import env from '../config/env.js';
import pino from 'pino';

const logger = pino({ name: 'cors' });

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Get allowed origins from environment variable
    const allowedOrigins = env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and credentials
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page',
    'X-Per-Page',
  ],
  maxAge: 86400, // 24 hours preflight cache
};

export default cors(corsOptions);