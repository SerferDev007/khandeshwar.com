/**
 * Test server that includes our new admin routes and middleware
 * Uses demo auth but with our new middleware system
 */

import express from 'express';
import cors from 'cors';
import adminRoutes from './src/routes/admin.js';

const app = express();
const PORT = 8081;

// Demo users for testing
const demoUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'Admin',
    status: 'Active'
  },
  {
    id: 2,
    username: 'viewer',
    email: 'viewer@example.com', 
    password: 'viewer123',
    role: 'Viewer',
    status: 'Active'
  }
];

// Simple JWT token generator (for demo purposes)
const generateDemoToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
  };
  
  // In a real app, this would be properly signed
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

// Mock database query function
global.query = async (sql, params) => {
  // Simple mock for user queries
  if (sql.includes('SELECT id, username, email, role, status FROM users WHERE id = ?')) {
    const userId = params[0];
    return demoUsers.filter(u => u.id === userId && u.status === 'Active');
  }
  return [];
};

// Mock environment config
global.env = {
  JWT_SECRET: 'demo-secret',
  JWT_EXPIRES_IN: '15m'
};

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0-test',
      environment: 'test'
    }
  });
});

// Login endpoint for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = demoUsers.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
  
  const accessToken = generateDemoToken(user);
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      accessToken,
      accessTokenExpiresIn: '15m'
    }
  });
});

// Mock user controller functions
const mockUserController = {
  createUser: (req, res) => {
    const { username, email, password, role } = req.validatedData;
    
    // Check if user already exists
    const existingUser = demoUsers.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    const newUser = {
      id: demoUsers.length + 1,
      username,
      email,
      role,
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    
    demoUsers.push({ ...newUser, password });
    
    // Return without password
    const { password: _, ...safeUser } = newUser;
    res.status(201).json({
      success: true,
      data: { user: safeUser }
    });
  }
};

// Override the user controller import to use our mock
const originalRequire = global.require;
global.mockControllers = mockUserController;

// Use our admin routes
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`📍 Environment: test`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Test credentials:`);
  console.log(`   • admin@example.com / admin123 (Admin)`);
  console.log(`   • viewer@example.com / viewer123 (Viewer)`);
});

export default app;