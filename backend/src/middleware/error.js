import pino from 'pino';

const logger = pino({ name: 'error' });

// Custom error class for API errors
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export function errorHandler(error, req, res, next) {
  let { statusCode = 500, message } = error;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    if (error.message.includes('username')) {
      message = 'Username already exists';
    } else if (error.message.includes('email')) {
      message = 'Email already exists';
    } else {
      message = 'Duplicate entry';
    }
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced record does not exist';
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  }

  // Don't expose sensitive error details in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    message = 'Something went wrong';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
    }),
  });
}

// Handle unhandled promise rejections
export function handleUnhandledRejection(reason, promise) {
  logger.error('Unhandled Promise Rejection:', reason);
  // Don't exit process in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}

// Handle uncaught exceptions
export function handleUncaughtException(error) {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
}

// 404 handler
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
}

// Async error wrapper
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Common error responses
export const errors = {
  badRequest: (message = 'Bad request') => new ApiError(400, message),
  unauthorized: (message = 'Unauthorized') => new ApiError(401, message),
  forbidden: (message = 'Forbidden') => new ApiError(403, message),
  notFound: (message = 'Not found') => new ApiError(404, message),
  conflict: (message = 'Conflict') => new ApiError(409, message),
  unprocessable: (message = 'Unprocessable entity') => new ApiError(422, message),
  internal: (message = 'Internal server error') => new ApiError(500, message),
};