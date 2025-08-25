/**
 * Demo authentication endpoints for testing without database
 * This file provides a simple in-memory authentication system
 */

import pino from 'pino';

const logger = pino({ name: 'demo-auth' });

const demoUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123', // In real app, this would be hashed
    role: 'Admin',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: 2,
    username: 'manager',
    email: 'manager@example.com',
    password: 'manager123',
    role: 'Manager',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: 3,
    username: 'staff',
    email: 'staff@example.com',
    password: 'staff123',
    role: 'Staff',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString()
  }
];

// Simple JWT token generator (for demo purposes)
const generateDemoToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
  };
  
  // In a real app, this would be properly signed
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

const generateDemoRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh',
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const demoAuthMiddleware = (req, res, next) => {
  // Enhanced request logging for all auth-protected endpoints
  logger.info('Demo authentication attempt', {
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

  // Skip auth for login endpoint
  if (req.path === '/api/auth/login' || req.path === '/health') {
    return next();
  }

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
    logger.warn('Demo authentication failed: no token provided', {
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

  try {
    const token = authHeader.split(' ')[1];
    
    // Log token verification attempt with partial token for debugging
    logger.info('Demo token verification attempt', {
      method: req.method,
      url: req.url,
      tokenStart: token.substring(0, 10) + '...',
      tokenLength: token.length,
      timestamp: new Date().toISOString()
    });
    
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    
    // Enhanced expiry check with detailed logging
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpiry = payload.exp;
    const timeUntilExpiry = tokenExpiry ? tokenExpiry - currentTime : null;
    
    logger.info('Demo token decoded successfully', {
      userId: payload.id,
      tokenExpiry: tokenExpiry ? new Date(tokenExpiry * 1000).toISOString() : null,
      timeUntilExpirySeconds: timeUntilExpiry,
      timeUntilExpiryMin: timeUntilExpiry ? Math.round(timeUntilExpiry / 60) : null,
      isExpired: tokenExpiry < currentTime
    });
    
    // Check if token is expired
    if (payload.exp < currentTime) {
      logger.warn('401 Response: Demo token expired', {
        method: req.method,
        url: req.url,
        route: req.path,
        reason: 'TokenExpired',
        expiredAt: new Date(payload.exp * 1000).toISOString(),
        expiredSecondsAgo: currentTime - payload.exp,
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

    // Find user
    const user = demoUsers.find(u => u.id === payload.id);
    if (!user) {
      logger.warn('Demo authentication failed: invalid token', {
        method: req.method,
        url: req.url,
        route: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        tokenStart: token.substring(0, 10) + '...',
        payloadUserId: payload.id,
        reason: 'UserNotFound',
        headers: {
          accept: req.get('Accept'),
          origin: req.get('Origin'),
          host: req.get('Host')
        },
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    req.user = user;
    logger.info('Demo authentication successful', {
      userId: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      method: req.method,
      url: req.url,
      route: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tokenExpiryInfo: {
        expiry: new Date(tokenExpiry * 1000).toISOString(),
        timeUntilExpiryMin: Math.round(timeUntilExpiry / 60)
      },
      timestamp: new Date().toISOString()
    });
    next();
  } catch (error) {
    // Enhanced error logging with token details
    logger.error('Demo authentication failed:', {
      errorName: error.name || 'UnknownError',
      errorMessage: error.message,
      method: req.method,
      url: req.url,
      route: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tokenStart: req.headers.authorization ? req.headers.authorization.substring(7, 17) + '...' : 'no-token',
      timestamp: new Date().toISOString()
    });
    
    logger.warn('401 Response: Demo invalid token format', {
      method: req.method,
      url: req.url,
      route: req.path,
      reason: 'InvalidTokenFormat',
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
      error: 'Invalid token format'
    });
  }
};

export const demoAuthRoutes = (app) => {
  // Login endpoint
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Find user
      const user = demoUsers.find(u => u.email === email && u.password === password);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Generate tokens
      const accessToken = generateDemoToken(user);
      const refreshToken = generateDemoRefreshToken(user);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  });

  // Profile endpoint
  app.get('/api/auth/profile', demoAuthMiddleware, (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json({
      success: true,
      data: userWithoutPassword
    });
  });

  // Logout endpoint
  app.post('/api/auth/logout', demoAuthMiddleware, (req, res) => {
    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  });

  // Demo endpoints for other entities (return empty arrays for now)
  app.get('/api/users', demoAuthMiddleware, (req, res) => {
    res.json({
      success: true,
      data: demoUsers.map(({ password: _, ...user }) => user)
    });
  });

  app.post('/api/users', demoAuthMiddleware, (req, res) => {
    // Simple demo POST endpoint for testing
    const { username, email, role } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        error: 'Username and email are required'
      });
    }
    
    const newUser = {
      id: demoUsers.length + 1,
      username,
      email,
      role: role || 'Viewer',
      status: 'Active',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    res.status(201).json({
      success: true,
      data: { user: newUser }
    });
  });

  app.get('/api/shops', demoAuthMiddleware, (req, res) => {
    res.json({
      success: true,
      data: []
    });
  });

  app.get('/api/tenants', demoAuthMiddleware, (req, res) => {
    res.json({
      success: true,
      data: []
    });
  });

  app.get('/api/agreements', demoAuthMiddleware, (req, res) => {
    res.json({
      success: true,
      data: []
    });
  });

  app.get('/api/loans', demoAuthMiddleware, (req, res) => {
    res.json({
      success: true,
      data: []
    });
  });

  app.get('/api/rent-penalties', demoAuthMiddleware, (req, res) => {
    res.json({
      success: true,
      data: []
    });
  });

  app.get('/api/transactions', demoAuthMiddleware, (req, res) => {
    res.json({
      success: true,
      data: []
    });
  });

  // Donations endpoints for testing authentication
  app.get('/api/donations', demoAuthMiddleware, (req, res) => {
    // Check for Admin role  
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Required roles: Admin'
      });
    }
    
    res.json({
      success: true,
      data: []
    });
  });

  app.post('/api/donations', demoAuthMiddleware, (req, res) => {
    // Check for Admin role
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Required roles: Admin'
      });
    }

    const { date, category, description, amount, donorName } = req.body;
    
    // Simple validation
    if (!date || !category || !description || !amount || !donorName) {
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        details: ['Missing required fields']
      });
    }

    // Mock donation creation
    const donation = {
      id: Date.now().toString(),
      date,
      category,
      description,
      amount,
      donorName,
      type: 'Donation',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: donation
    });
  });
};