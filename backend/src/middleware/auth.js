import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { query } from '../config/db.js';
import pino from 'pino';

const logger = pino({ name: 'auth' });

// JWT Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    // Enhanced request logging for all auth-protected endpoints
    logger.info('Authentication attempt', {
      method: req.method,
      url: req.url,
      route: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      authHeaderPresent: !!req.headers.authorization,
      authHeaderPrefix: req.headers.authorization ? req.headers.authorization.substring(0, 10) : null,
      contentType: req.get('Content-Type'),
      referer: req.get('Referer'),
      timestamp: new Date().toISOString()
    });

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Add specific developer warning for POST /api/users without token
      if (req.method === 'POST' && req.url === '/api/users') {
        logger.warn('Developer Warning: POST /api/users called without authentication token', {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      // Enhanced 401 logging with all relevant headers
      logger.warn('Authentication failed: no token provided', {
        method: req.method,
        url: req.url,
        route: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        referer: req.get('Referer'),
        authHeader: authHeader ? authHeader.substring(0, 20) + '...' : 'null',
        headers: {
          accept: req.get('Accept'),
          origin: req.get('Origin'),
          host: req.get('Host')
        },
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({
        success: false,
        error: 'Missing token. Authorization header with Bearer token required (format: "Authorization: Bearer <token>")'
      });
    }

    const token = authHeader.substring(7);
    
    // Log token verification attempt with partial token for debugging
    logger.info('Token verification attempt', {
      method: req.method,
      url: req.url,
      tokenStart: token.substring(0, 10) + '...',
      tokenLength: token.length,
      timestamp: new Date().toISOString()
    });
    
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Log token expiry information
    const tokenExpiry = decoded.exp ? new Date(decoded.exp * 1000) : null;
    const timeUntilExpiry = tokenExpiry ? tokenExpiry.getTime() - Date.now() : null;
    
    logger.info('Token decoded successfully', {
      userId: decoded.userId,
      tokenExpiry: tokenExpiry ? tokenExpiry.toISOString() : null,
      timeUntilExpiryMs: timeUntilExpiry,
      timeUntilExpiryMin: timeUntilExpiry ? Math.round(timeUntilExpiry / 60000) : null,
      isExpired: tokenExpiry ? tokenExpiry < new Date() : false
    });
    
    // Check if user still exists and is active
    const users = await query(
      'SELECT id, username, email, role, status FROM users WHERE id = ? AND status = ?',
      [decoded.userId, 'Active']
    );

    if (users.length === 0) {
      logger.warn('Authentication failed: invalid user or expired token', {
        userId: decoded.userId,
        method: req.method,
        url: req.url,
        route: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        tokenStart: token.substring(0, 10) + '...',
        userStatus: 'NOT_FOUND',
        searchedStatus: 'Active',
        headers: {
          accept: req.get('Accept'),
          origin: req.get('Origin'),
          host: req.get('Host')
        },
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = users[0];
    logger.info('Authentication successful', {
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      status: req.user.status,
      method: req.method,
      url: req.url,
      route: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tokenExpiryInfo: tokenExpiry ? {
        expiry: tokenExpiry.toISOString(),
        timeUntilExpiryMin: Math.round(timeUntilExpiry / 60000)
      } : null,
      timestamp: new Date().toISOString()
    });
    next();
  } catch (error) {
    // Enhanced error logging with token details
    logger.error('Authentication failed:', {
      errorName: error.name,
      errorMessage: error.message,
      method: req.method,
      url: req.url,
      route: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tokenStart: req.headers.authorization ? req.headers.authorization.substring(7, 17) + '...' : 'no-token',
      timestamp: new Date().toISOString()
    });
    
    if (error.name === 'JsonWebTokenError') {
      logger.warn('401 Response: Invalid token format', {
        method: req.method,
        url: req.url,
        route: req.path,
        reason: 'JsonWebTokenError',
        errorMessage: error.message,
        headers: {
          accept: req.get('Accept'),
          origin: req.get('Origin'),
          userAgent: req.get('User-Agent')
        },
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.warn('401 Response: Token expired', {
        method: req.method,
        url: req.url,
        route: req.path,
        reason: 'TokenExpiredError',
        expiredAt: error.expiredAt ? error.expiredAt.toISOString() : 'unknown',
        headers: {
          accept: req.get('Accept'),
          origin: req.get('Origin'),
          userAgent: req.get('User-Agent')
        },
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    logger.error('500 Response: Authentication error', {
      method: req.method,
      url: req.url,
      route: req.path,
      errorName: error.name,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// Role-based authorization middleware
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // If no specific roles required, just need to be authenticated
    if (roles.length === 0) {
      return next();
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed: insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    logger.info('Authorization successful', {
      userId: req.user.id,
      userRole: req.user.role,
      requiredRoles: roles,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  };
};

// Composable guard that combines authentication and authorization
export const requireRoles = (roles = []) => {
  return [authenticate, authorize(roles)];
};

// Optional authentication (for endpoints that work with or without auth)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    const users = await query(
      'SELECT id, username, email, role, status FROM users WHERE id = ? AND status = ?',
      [decoded.userId, 'Active']
    );

    if (users.length > 0) {
      req.user = users[0];
    }

    return next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    return next();
  }
};