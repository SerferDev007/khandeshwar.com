import { v4 as uuidv4 } from 'uuid';

/**
 * Comprehensive Route Activity Logger Middleware
 * 
 * Provides structured console.log based activity logging for all routes
 * following the enhanced logging standards defined in ENHANCED_LOGGING_GUIDE.md
 * 
 * Features:
 * - Request correlation IDs for traceability
 * - Structured console logging with timestamps
 * - Performance timing measurements
 * - Request/response data logging
 * - Error handling and logging
 * - Consistent format with icons and component tags
 */

/**
 * Generate a short correlation ID for request tracking
 */
const generateRequestId = () => {
  return uuidv4().substring(0, 8);
};

/**
 * Sanitize request data for logging (remove sensitive information)
 */
const sanitizeRequestData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'session', 'secret'];
  
  const processValue = (key, value) => {
    const lowerKey = key?.toString().toLowerCase() || '';
    
    // Remove sensitive fields
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      return '[REDACTED]';
    }
    
    // Truncate long text fields
    if (typeof value === 'string' && value.length > 500) {
      return value.substring(0, 500) + '... [TRUNCATED]';
    }
    
    // Recursively process nested objects
    if (value && typeof value === 'object') {
      return sanitizeRequestData(value);
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
 * Get route pattern from Express request
 */
const getRoutePattern = (req) => {
  const route = req.route;
  if (route) {
    return route.path;
  }
  
  // Fallback to URL pattern recognition
  const url = req.originalUrl || req.url;
  // Extract base path and detect parameter patterns
  return url.replace(/\/[0-9a-fA-F-]{8,}/g, '/:id').split('?')[0];
};

/**
 * Main activity logging middleware
 */
export const activityLogger = (req, res, next) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Attach request ID to request object for use in controllers
  req.requestId = requestId;
  req.startTime = startTime;
  
  // === REQUEST ENTRY LOGGING ===
  console.log(`[${timestamp}] [ROUTE-ACTIVITY] [${requestId}] 🔍 Incoming request`);
  console.log(`[${timestamp}] [REQUEST] [${requestId}] 📋 Request details:`, {
    method: req.method,
    url: req.originalUrl || req.url,
    route: getRoutePattern(req),
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    userId: req.user?.id,
    userRole: req.user?.role
  });

  // === REQUEST BODY LOGGING ===
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[${timestamp}] [REQUEST-BODY] [${requestId}] 📥 Request payload:`, 
      sanitizeRequestData(req.body));
  }

  // === QUERY PARAMETERS LOGGING ===
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`[${timestamp}] [REQUEST-QUERY] [${requestId}] 🔍 Query parameters:`, 
      sanitizeRequestData(req.query));
  }

  // === URL PARAMETERS LOGGING ===
  if (req.params && Object.keys(req.params).length > 0) {
    console.log(`[${timestamp}] [REQUEST-PARAMS] [${requestId}] 🎯 URL parameters:`, 
      sanitizeRequestData(req.params));
  }

  // === RESPONSE INTERCEPTION ===
  const originalSend = res.send;
  const originalJson = res.json;
  const originalStatus = res.status;
  
  let responseData = null;
  let statusCode = 200;

  // Intercept res.status() calls
  res.status = function(code) {
    statusCode = code;
    return originalStatus.call(this, code);
  };

  // Intercept res.json() calls
  res.json = function(data) {
    responseData = data;
    logResponse();
    return originalJson.call(this, data);
  };

  // Intercept res.send() calls
  res.send = function(data) {
    if (!responseData) {
      responseData = data;
      logResponse();
    }
    return originalSend.call(this, data);
  };

  // === RESPONSE LOGGING FUNCTION ===
  const logResponse = () => {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    const responseTimestamp = new Date().toISOString();
    
    // Log completion status
    const statusIcon = statusCode >= 400 ? '❌' : '✅';
    const statusLevel = statusCode >= 400 ? 'ERROR' : 'SUCCESS';
    
    console.log(`[${responseTimestamp}] [${statusLevel}] [${requestId}] ${statusIcon} Request completed`);
    console.log(`[${responseTimestamp}] [PERFORMANCE] [${requestId}] ⏱️ Processing time: ${processingTime}ms`);
    console.log(`[${responseTimestamp}] [RESPONSE-STATUS] [${requestId}] 📊 Status: ${statusCode}`);
    
    // Log response data (sanitized)
    if (responseData) {
      const sanitizedResponse = sanitizeRequestData(responseData);
      
      // For successful responses, show summary
      if (statusCode < 400) {
        if (sanitizedResponse && typeof sanitizedResponse === 'object') {
          const summary = {
            success: sanitizedResponse.success,
            dataType: Array.isArray(sanitizedResponse.data) ? 'array' : typeof sanitizedResponse.data,
            itemCount: Array.isArray(sanitizedResponse.data) ? sanitizedResponse.data.length : undefined,
            hasData: !!sanitizedResponse.data
          };
          console.log(`[${responseTimestamp}] [RESPONSE-SUMMARY] [${requestId}] 📤 Response summary:`, summary);
        }
      } else {
        // For error responses, show full details
        console.log(`[${responseTimestamp}] [RESPONSE-ERROR] [${requestId}] 🔍 Error details:`, sanitizedResponse);
      }
    }

    // Log performance metrics
    console.log(`[${responseTimestamp}] [METRICS] [${requestId}] 📈 Performance metrics:`, {
      route: `${req.method} ${getRoutePattern(req)}`,
      statusCode,
      processingTime: `${processingTime}ms`,
      timestamp: responseTimestamp,
      userId: req.user?.id,
      userRole: req.user?.role
    });
  };

  // === ERROR HANDLING ===
  const originalNext = next;
  const wrappedNext = (err) => {
    if (err) {
      const errorTimestamp = new Date().toISOString();
      const processingTime = Date.now() - startTime;
      
      console.log(`[${errorTimestamp}] [ERROR] [${requestId}] ❌ Request failed after ${processingTime}ms`);
      console.log(`[${errorTimestamp}] [ERROR-DETAILS] [${requestId}] 🔍 Error information:`, {
        name: err.name,
        message: err.message,
        code: err.code,
        status: err.status,
        stack: err.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
      });
      
      console.log(`[${errorTimestamp}] [ERROR-CONTEXT] [${requestId}] 📋 Request context:`, {
        method: req.method,
        url: req.originalUrl || req.url,
        route: getRoutePattern(req),
        userId: req.user?.id,
        userRole: req.user?.role,
        processingTime: `${processingTime}ms`
      });
    }
    
    return originalNext(err);
  };

  next = wrappedNext;
  next();
};

/**
 * Utility function for controllers to log custom activity
 */
export const logActivity = (req, level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const requestId = req.requestId || 'unknown';
  
  const levelIcons = {
    info: '🔍',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔧'
  };
  
  const icon = levelIcons[level] || '📝';
  
  console.log(`[${timestamp}] [${level.toUpperCase()}] [${requestId}] ${icon} ${message}`, 
    data && Object.keys(data).length > 0 ? sanitizeRequestData(data) : '');
};

export default activityLogger;