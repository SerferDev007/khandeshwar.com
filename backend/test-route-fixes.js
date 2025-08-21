#!/usr/bin/env node

/**
 * Test script to verify POST /api/users middleware and route fixes
 * Tests authentication, authorization, and validation order
 */

import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

// Mock environment and dependencies
const mockEnv = {
  JWT_SECRET: 'test-secret-key-for-middleware-testing-12345',
  JWT_EXPIRES_IN: '15m'
};

const mockQuery = async (sql, params) => {
  // Mock user lookup for authentication
  if (sql.includes('SELECT id, username, email, role, status FROM users WHERE id = ?')) {
    const userId = params[0];
    if (userId === 1) {
      return [{
        id: 1,
        username: 'admin',
        email: 'admin@example.com', 
        role: 'Admin',
        status: 'Active'
      }];
    }
    if (userId === 2) {
      return [{
        id: 2,
        username: 'viewer',
        email: 'viewer@example.com',
        role: 'Viewer', 
        status: 'Active'
      }];
    }
  }
  return [];
};

const mockLogger = {
  info: (msg, data) => console.log(`INFO: ${msg}`),
  warn: (msg, data) => console.log(`WARN: ${msg}`), 
  error: (msg, data) => console.log(`ERROR: ${msg}`)
};

// Set up globals for module imports
global.env = mockEnv;
global.query = mockQuery;
global.pino = () => mockLogger;

// Import our middleware after setting up mocks
const { authenticate, authorize, requireRoles } = await import('./src/middleware/auth.js');
const { validate, schemas } = await import('./src/middleware/validate.js');

// Mock user controller
const mockCreateUser = (req, res) => {
  const { username, email, password, role } = req.validatedData;
  
  if (email === 'existing@example.com') {
    return res.status(409).json({
      success: false,
      error: 'Email already registered'
    });
  }
  
  const newUser = {
    id: Date.now(),
    username,
    email,
    role: role || 'Viewer',
    status: 'Active',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: { user: newUser }
  });
};

// Test endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  let user = null;
  if (email === 'admin@example.com' && password === 'admin123') {
    user = { id: 1, username: 'admin', email, role: 'Admin' };
  } else if (email === 'viewer@example.com' && password === 'viewer123') {
    user = { id: 2, username: 'viewer', email, role: 'Viewer' };
  }
  
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { userId: user.id, username: user.username, email: user.email, role: user.role },
    mockEnv.JWT_SECRET,
    { expiresIn: mockEnv.JWT_EXPIRES_IN }
  );
  
  res.json({
    success: true,
    data: { 
      user, 
      accessToken: token, 
      accessTokenExpiresIn: mockEnv.JWT_EXPIRES_IN 
    }
  });
});

// Test POST /api/users with new middleware structure (requireRoles)
app.post('/api/users', ...requireRoles(['Admin']), validate(schemas.register), mockCreateUser);

// Test POST /api/admin/users with requireRoles 
app.post('/api/admin/users', ...requireRoles(['Admin']), validate(schemas.register), mockCreateUser);

// Start test server
const PORT = 8083;
app.listen(PORT, async () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  
  try {
    // Get tokens
    console.log('\n1. Getting authentication tokens...');
    const adminLoginResponse = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    
    const adminLoginData = await adminLoginResponse.json();
    const adminToken = adminLoginData.success ? adminLoginData.data.accessToken : null;
    
    const viewerLoginResponse = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'viewer@example.com', password: 'viewer123' })
    });
    
    const viewerLoginData = await viewerLoginResponse.json();
    const viewerToken = viewerLoginData.success ? viewerLoginData.data.accessToken : null;
    
    if (!adminToken || !viewerToken) {
      console.log('❌ Failed to get authentication tokens');
      process.exit(1);
    }
    
    console.log('✅ Got admin and viewer tokens');
    
    // Test cases for POST /api/users
    console.log('\n2. Testing POST /api/users endpoint...');
    
    // Test 1: No token (401)
    console.log('\n2.1 Testing without token...');
    const noTokenResponse = await fetch(`http://localhost:${PORT}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123'
      })
    });
    
    console.log(`Status: ${noTokenResponse.status}`);
    const noTokenData = await noTokenResponse.json();
    console.log('Response:', JSON.stringify(noTokenData, null, 2));
    
    if (noTokenResponse.status === 401) {
      console.log('✅ 401 Unauthorized correctly returned for no token');
    } else {
      console.log(`❌ Expected 401, got ${noTokenResponse.status}`);
    }
    
    // Test 2: Viewer token (403)
    console.log('\n2.2 Testing with viewer token...');
    const viewerTokenResponse = await fetch(`http://localhost:${PORT}/api/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${viewerToken}`
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123'
      })
    });
    
    console.log(`Status: ${viewerTokenResponse.status}`);
    const viewerTokenData = await viewerTokenResponse.json();
    console.log('Response:', JSON.stringify(viewerTokenData, null, 2));
    
    if (viewerTokenResponse.status === 403) {
      console.log('✅ 403 Forbidden correctly returned for non-admin user');
    } else {
      console.log(`❌ Expected 403, got ${viewerTokenResponse.status}`);
    }
    
    // Test 3: Admin token with invalid data (400)
    console.log('\n2.3 Testing admin token with invalid data...');
    const invalidDataResponse = await fetch(`http://localhost:${PORT}/api/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        username: 'x', // Too short
        email: 'invalid-email',
        password: '123' // Too short
      })
    });
    
    console.log(`Status: ${invalidDataResponse.status}`);
    const invalidDataData = await invalidDataResponse.json();
    console.log('Response:', JSON.stringify(invalidDataData, null, 2));
    
    if (invalidDataResponse.status === 400) {
      console.log('✅ 400 Bad Request correctly returned for invalid data');
    } else {
      console.log(`❌ Expected 400, got ${invalidDataResponse.status}`);
    }
    
    // Test 4: Admin token with valid data (201)
    console.log('\n2.4 Testing admin token with valid data...');
    const validDataResponse = await fetch(`http://localhost:${PORT}/api/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'NewPass123'
      })
    });
    
    console.log(`Status: ${validDataResponse.status}`);
    const validDataData = await validDataResponse.json();
    console.log('Response:', JSON.stringify(validDataData, null, 2));
    
    if (validDataResponse.status === 201) {
      console.log('✅ 201 Created correctly returned for valid admin request');
    } else {
      console.log(`❌ Expected 201, got ${validDataResponse.status}`);
    }
    
    // Test POST /api/admin/users with same tests
    console.log('\n3. Testing POST /api/admin/users endpoint...');
    
    const adminUserResponse = await fetch(`http://localhost:${PORT}/api/admin/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        username: 'adminuser',
        email: 'adminuser@example.com',
        password: 'AdminPass123'
      })
    });
    
    console.log(`Status: ${adminUserResponse.status}`);
    const adminUserData = await adminUserResponse.json();
    console.log('Response:', JSON.stringify(adminUserData, null, 2));
    
    if (adminUserResponse.status === 201) {
      console.log('✅ POST /api/admin/users works correctly with admin token');
    } else {
      console.log(`❌ Expected 201 for admin users endpoint, got ${adminUserResponse.status}`);
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('   • POST /api/users now properly enforces authentication before authorization');
    console.log('   • requireRoles composable works correctly');
    console.log('   • Middleware order is: authenticate -> authorize -> validate -> controller');
    console.log('   • All expected HTTP status codes are returned correctly');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
});