import { z } from 'zod';
import pino from 'pino';

const logger = pino({ name: 'validation' });

// Generic validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    console.log('[ValidationMiddleware] Validation request:', {
      method: req.method,
      url: req.url,
      hasBody: !!Object.keys(req.body || {}).length,
      hasQuery: !!Object.keys(req.query || {}).length,
      hasParams: !!Object.keys(req.params || {}).length
    });

    try {
      logger.info('Validation attempt', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        hasBody: !!Object.keys(req.body || {}).length,
        hasQuery: !!Object.keys(req.query || {}).length,
        hasParams: !!Object.keys(req.params || {}).length
      });

      // Validate request body, query, and params - body wins over query/params
      const validationData = {
        ...req.params,
        ...req.query,
        ...req.body,
      };

      console.log('[ValidationMiddleware] Validation data prepared:', {
        fieldCount: Object.keys(validationData).length,
        fields: Object.keys(validationData)
      });

      const validatedData = schema.parse(validationData);
      
      console.log('[ValidationMiddleware] Validation successful:', {
        validatedFields: Object.keys(validatedData).length
      });
      
      // Replace request data with validated data
      req.validatedData = validatedData;
      
      logger.info('Validation successful', {
        method: req.method,
        url: req.url,
        fieldsValidated: Object.keys(validatedData)
      });
      
      return next();
    } catch (error) {
      console.error('[ValidationMiddleware] Validation failed:', {
        error: error.message,
        method: req.method,
        url: req.url
      });

      logger.error('Validation failed:', {
        error: error.message,
        method: req.method,
        url: req.url,
        ip: req.ip
      });
      
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
    sort: z.enum(['id', 'username', 'email', 'role', 'status', 'email_verified', 'last_login', 'created_at', 'updated_at']).optional().default('created_at'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    role: z.enum(['Admin', 'Treasurer', 'Viewer']).optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
  }),

  // ID parameter schema - accepts both legacy and UUID v4 formats
  idParam: z.object({
    id: z.string().refine(
      (id) => {
        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        // Legacy format: 13+ digit timestamp followed by 9 alphanumeric characters
        const legacyRegex = /^\d{13,}\w{9}$/;
        
        return uuidRegex.test(id) || legacyRegex.test(id);
      },
      {
        message: 'Invalid ID format. Must be either UUID v4 or legacy format.',
      }
    ),
  }),
};

// Validate file upload parameters
export const validateFileUpload = (req, res, next) => {
  const schema = z.object({
    filename: z.string().min(1, 'Filename is required'),
    contentType: z.string().min(1, 'Content type is required'),
    size: z.number().positive('File size must be positive').max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  });

  try {
    logger.info('File upload validation attempt', {
      method: req.method,
      url: req.url,
      ip: req.ip
    });

    const validatedData = schema.parse(req.body);
    req.validatedData = validatedData;
    
    logger.info('File upload validation successful', {
      method: req.method,
      url: req.url,
      filename: validatedData.filename,
      size: validatedData.size
    });
    
    return next();
  } catch (error) {
    logger.error('File upload validation failed:', {
      error: error.message,
      method: req.method,
      url: req.url,
      ip: req.ip
    });
    
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
};