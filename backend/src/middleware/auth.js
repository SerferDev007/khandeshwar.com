import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { query } from '../config/db.js';
import pino from 'pino';

const logger = pino({ name: 'auth' });

// JWT Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    logger.info('Authentication attempt', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
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
      
      logger.warn('Authentication failed: no token provided', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        success: false,
        error: 'Missing token. Authorization header with Bearer token required (format: "Authorization: Bearer <token>")'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
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
        ip: req.ip,
        userAgent: req.get('User-Agent')
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
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

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