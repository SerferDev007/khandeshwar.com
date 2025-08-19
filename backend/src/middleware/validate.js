import { z } from 'zod';
import pino from 'pino';

const logger = pino({ name: 'validation' });

// Generic validation middleware factory
export function validate(schema) {
  return (req, res, next) => {
    try {
      // Validate request body, query, and params
      const validationData = {
        ...req.body,
        ...req.query,
        ...req.params,
      };

      const validatedData = schema.parse(validationData);
      
      // Replace request data with validated data
      req.validatedData = validatedData;
      next();
    } catch (error) {
      logger.error('Validation failed:', error);
      
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errorMessages,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Validation error',
      });
    }
  };
}

// Common validation schemas
export const schemas = {
  // User registration schema
  register: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be less than 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    role: z.enum(['Admin', 'Treasurer', 'Viewer']).optional().default('Viewer'),
  }),

  // User login schema
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  // Refresh token schema
  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),

  // User update schema
  updateUser: z.object({
    id: z.string().uuid('Invalid user ID'),
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be less than 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    email: z.string().email('Invalid email address').optional(),
    role: z.enum(['Admin', 'Treasurer', 'Viewer']).optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
  }),

  // Password change schema
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  }),

  // File upload schema
  fileUpload: z.object({
    filename: z.string().min(1, 'Filename is required'),
    contentType: z.string().min(1, 'Content type is required'),
    size: z.number().positive('File size must be positive').max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  }),

  // Pagination schema
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('10'),
    sort: z.string().optional().default('created_at'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),

  // ID parameter schema
  idParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
};

// Validate file upload parameters
export function validateFileUpload(req, res, next) {
  const schema = z.object({
    filename: z.string().min(1, 'Filename is required'),
    contentType: z.string().min(1, 'Content type is required'),
    size: z.number().positive('File size must be positive').max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  });

  try {
    const validatedData = schema.parse(req.body);
    req.validatedData = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'File upload validation failed',
        details: errorMessages,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Validation error',
    });
  }
}