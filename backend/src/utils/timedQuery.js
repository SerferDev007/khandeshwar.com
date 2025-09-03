/**
 * Timed Query Helper
 * 
 * Provides database query execution with timeout enforcement to prevent
 * hanging requests when database operations take too long.
 */

import { dbg } from './debugLogger.js';

/**
 * Execute a database query with timeout enforcement using Promise.race
 * 
 * @param {Function} queryFunction - The database query function to execute
 * @param {Array} params - Parameters for the query
 * @param {number} timeoutMs - Timeout in milliseconds (default 8000ms = 8s)
 * @param {string} requestId - Correlation ID for logging
 * @returns {Promise} - Query result or timeout error
 */
export async function timedQuery(queryFunction, params = [], timeoutMs = 8000, requestId = null) {
  const operationId = `query-${Date.now()}`;
  
  // Log timeout operation start
  dbg('timed-query', 'db-timeout-start', {
    timeoutMs,
    operationId,
    paramCount: params.length,
    queryType: 'database-operation'
  }, requestId);

  // Create timeout promise that rejects after specified time
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const timeoutError = new Error(`Database operation timed out after ${timeoutMs}ms`);
      timeoutError.code = 'DB_TIMEOUT';
      timeoutError.operationId = operationId;
      timeoutError.timeoutMs = timeoutMs;
      
      dbg('timed-query', 'db-timeout', {
        operationId,
        timeoutMs,
        errorCode: 'DB_TIMEOUT',
        message: 'Database query exceeded timeout limit'
      }, requestId);
      
      reject(timeoutError);
    }, timeoutMs);
  });

  // Create query promise
  const queryPromise = queryFunction(...params);

  try {
    // Race between query completion and timeout
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    // Clear timeout if query completed successfully
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    dbg('timed-query', 'db-operation-completed', {
      operationId,
      success: true,
      resultType: Array.isArray(result) ? 'array' : typeof result,
      resultSize: Array.isArray(result) ? result.length : 'n/a'
    }, requestId);

    return result;
  } catch (error) {
    // Clear timeout on any error
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Log the error with context
    dbg('timed-query', 'db-operation-failed', {
      operationId,
      errorCode: error.code,
      errorMessage: error.message,
      isTimeout: error.code === 'DB_TIMEOUT',
      timeoutMs: error.code === 'DB_TIMEOUT' ? timeoutMs : undefined
    }, requestId);

    // Re-throw the error for upstream handling
    throw error;
  }
}

/**
 * Create a route-level watchdog timer that returns 504 if the handler doesn't complete
 * 
 * @param {Object} res - Express response object
 * @param {number} timeoutMs - Timeout in milliseconds (default 10000ms = 10s)
 * @param {string} requestId - Correlation ID for logging
 * @returns {Function} - Cleanup function to clear the watchdog
 */
export function createRouteWatchdog(res, timeoutMs = 10000, requestId = null) {
  const watchdogId = `watchdog-${Date.now()}`;
  
  dbg('route-watchdog', 'watchdog-start', {
    watchdogId,
    timeoutMs,
    route: res.req?.route?.path || 'unknown',
    method: res.req?.method || 'unknown'
  }, requestId);

  let watchdogCompleted = false;

  const timeoutId = setTimeout(() => {
    if (!watchdogCompleted && !res.headersSent) {
      watchdogCompleted = true;
      
      dbg('route-watchdog', 'watchdog-timeout', {
        watchdogId,
        timeoutMs,
        message: 'Route handler exceeded timeout limit',
        responseStatus: 504
      }, requestId);

      res.status(504).json({
        success: false,
        error: 'Request timeout. The operation took too long to complete.',
        code: 'ROUTE_TIMEOUT'
      });
    }
  }, timeoutMs);

  // Return cleanup function
  return function clearWatchdog() {
    if (!watchdogCompleted) {
      watchdogCompleted = true;
      clearTimeout(timeoutId);
      
      dbg('route-watchdog', 'watchdog-cleared', {
        watchdogId,
        cleared: true,
        responseStatus: res.statusCode
      }, requestId);
    }
  };
}