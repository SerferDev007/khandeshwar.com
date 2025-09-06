import pino from "pino";

const logger = pino({ name: "error" });

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
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  
  // Log error with context
  console.error('[API ERROR]', {
    path: req.path,
    method: req.method,
    status,
    code,
    message: err.message,
    userId: req.user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: err.stack
  });
  
  // Format error response
  let message = err.message || 'Internal Server Error';
  
  // Handle specific database errors
  if (err.code === 'ER_NO_SUCH_TABLE') {
    message = 'Database table does not exist';
  } else if (err.code === 'ER_BAD_FIELD_ERROR') {
    message = 'Invalid database field';
  } else if (err.code === 'ECONNREFUSED') {
    message = 'Database connection failed';
  }
  
  // Don't expose internal errors in production
  if (status === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }
  
  res.status(status).json({ 
    success: false, 
    error: { 
      code, 
      message
    } 
  });
}

// Handle unhandled promise rejections
// Handle unhandled promise rejections
export const handleUnhandledRejection = (reason, promise) => {
  logger.error("Unhandled Promise Rejection:", reason);
  // Don't exit process in production, just log the error
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
};

// Handle uncaught exceptions
export const handleUncaughtException = (error) => {
  logger.error("Uncaught Exception:", {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });
  process.exit(1);
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common error responses
export const errors = {
  badRequest: (message = "Bad request") => new ApiError(400, message),
  unauthorized: (message = "Unauthorized") => new ApiError(401, message),
  forbidden: (message = "Forbidden") => new ApiError(403, message),
  notFound: (message = "Not found") => new ApiError(404, message),
  conflict: (message = "Conflict") => new ApiError(409, message),
  unprocessable: (message = "Unprocessable entity") =>
    new ApiError(422, message),
  internal: (message = "Internal server error") => new ApiError(500, message),
};
