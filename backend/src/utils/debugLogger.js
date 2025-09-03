/**
 * Debug Logger Utility
 * 
 * Provides structured diagnostic logging for debugging shop creation issues.
 * This is a temporary utility that can be removed after the root cause is identified.
 * 
 * Usage:
 *   import { dbg } from '../utils/debugLogger.js';
 *   dbg('shop-creation', 'request-received', { body: req.body }, requestId);
 */

import pino from 'pino';

const logger = pino({ 
  name: 'debug-diagnostics',
  level: 'debug'
});

/**
 * Generate a correlation ID for request tracking
 */
export const generateCorrelationId = () => {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Structured debug logging with correlation ID support
 * 
 * @param {string} namespace - Debug namespace (e.g., 'shop-creation')
 * @param {string} label - Debug point label (e.g., 'validation-complete')
 * @param {any} data - Data to log (will be sanitized)
 * @param {string} requestId - Optional correlation ID
 */
export const dbg = (namespace, label, data = {}, requestId = null) => {
  const timestamp = new Date().toISOString();
  
  // Sanitize sensitive data
  const sanitizedData = sanitizeLogData(data);
  
  const logEntry = {
    namespace,
    label,
    timestamp,
    requestId,
    data: sanitizedData,
    memoryUsage: process.memoryUsage(),
    pid: process.pid
  };

  logger.debug(logEntry, `[${namespace}] ${label}`);
  
  // In development, also log to console for immediate visibility
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔍 [${namespace}:${label}${requestId ? `:${requestId}` : ''}]`, sanitizedData);
  }
};

/**
 * Log MySQL error details with enhanced diagnostics
 * 
 * @param {string} namespace - Debug namespace
 * @param {Error} error - MySQL error object
 * @param {Object} queryContext - Additional query context
 * @param {string} requestId - Correlation ID
 */
export const dbgMySQLError = (namespace, error, queryContext = {}, requestId = null) => {
  const errorDetails = {
    message: error.message,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage,
    sql: error.sql,
    stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
    queryContext: sanitizeLogData(queryContext)
  };

  dbg(namespace, 'mysql-error', errorDetails, requestId);
  
  // Provide specific diagnostics based on error code
  const diagnostics = getMySQLErrorDiagnostics(error.code);
  if (diagnostics) {
    dbg(namespace, 'mysql-error-diagnostics', diagnostics, requestId);
  }
};

/**
 * Get specific diagnostics for MySQL error codes
 * 
 * @param {string} errorCode - MySQL error code
 * @returns {Object|null} Diagnostic information
 */
const getMySQLErrorDiagnostics = (errorCode) => {
  const diagnostics = {
    'ER_BAD_FIELD_ERROR': {
      diagnosis: 'Column name in query does not exist in table',
      commonCauses: ['Column name typo', 'Schema drift', 'Case sensitivity mismatch'],
      suggestions: ['Check column names in toDbObject()', 'Verify database schema', 'Run migrations']
    },
    'ER_NO_DEFAULT_FOR_FIELD': {
      diagnosis: 'Required column missing value and has no default',
      commonCauses: ['Missing NOT NULL field in insert', 'Validation not providing required field'],
      suggestions: ['Check all required fields are provided', 'Verify model constructor', 'Review validation schema']
    },
    'ER_TRUNCATED_WRONG_VALUE': {
      diagnosis: 'Data type mismatch or invalid value format',
      commonCauses: ['String where number expected', 'Invalid date format', 'Enum value mismatch'],
      suggestions: ['Check data types in model', 'Verify enum values', 'Validate input parsing']
    },
    'ER_DATA_TOO_LONG': {
      diagnosis: 'Value exceeds column length limit',
      commonCauses: ['Text too long for VARCHAR', 'Number exceeds DECIMAL precision'],
      suggestions: ['Check column size limits', 'Truncate or validate input length', 'Review schema constraints']
    },
    'ER_DUP_ENTRY': {
      diagnosis: 'Duplicate value for unique constraint',
      commonCauses: ['Duplicate shop number', 'Race condition in creation'],
      suggestions: ['Check uniqueness before insert', 'Handle race conditions', 'Verify duplicate detection logic']
    }
  };

  return diagnostics[errorCode] || null;
};

/**
 * Sanitize log data to remove sensitive information
 * 
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 */
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  // Remove or truncate sensitive fields
  const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'session'];
  const truncateFields = ['description', 'address', 'notes'];
  
  const processValue = (key, value) => {
    const lowerKey = key?.toString().toLowerCase() || '';
    
    // Remove sensitive fields
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      return '[REDACTED]';
    }
    
    // Truncate long text fields
    if (truncateFields.some(field => lowerKey.includes(field)) && typeof value === 'string' && value.length > 200) {
      return value.substring(0, 200) + '... [TRUNCATED]';
    }
    
    // Recursively process nested objects
    if (value && typeof value === 'object') {
      return sanitizeLogData(value);
    }
    
    return value;
  };
  
  if (Array.isArray(sanitized)) {
    return sanitized.map((item, index) => processValue(index, item));
  }
  
  Object.keys(sanitized).forEach(key => {
    sanitized[key] = processValue(key, sanitized[key]);
  });
  
  return sanitized;
};

/**
 * Create a timing utility for performance measurement
 * 
 * @param {string} namespace - Debug namespace
 * @param {string} label - Operation label
 * @param {string} requestId - Correlation ID
 * @returns {Function} Function to call when operation completes
 */
export const dbgTimer = (namespace, label, requestId = null) => {
  const startTime = process.hrtime.bigint();
  
  dbg(namespace, `${label}-start`, { startTime: startTime.toString() }, requestId);
  
  return (data = {}) => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    
    dbg(namespace, `${label}-complete`, { 
      ...data, 
      duration: `${duration.toFixed(2)}ms`,
      startTime: startTime.toString(),
      endTime: endTime.toString()
    }, requestId);
  };
};

export default { dbg, dbgMySQLError, dbgTimer, generateCorrelationId };