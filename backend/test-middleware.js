#!/usr/bin/env node

/**
 * Simple test to verify our middleware and admin routes work correctly
 * This tests the core functionality without requiring database setup
 */

import express from 'express';
import jwt from 'jsonwebtoken';

// Create a minimal test app
const app = express();
app.use(express.json());

// Mock environment
const mockEnv = {
  JWT_SECRET: 'test-secret-key',
  JWT_EXPIRES_IN: '15m'
};

// Mock database query function  
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

// Mock pino logger
const mockLogger = {
  info: (msg, data) => console.log(`INFO: ${msg}`, data || ''),
  warn: (msg, data) => console.log(`WARN: ${msg}`, data || ''),
  error: (msg, data) => console.log(`ERROR: ${msg}`, data || '')
};

// Mock the imports by setting up global mocks
global.env = mockEnv;
global.query = mockQuery;
global.pino = () => mockLogger;

// Now import our middleware (after setting up mocks)
const { authenticate, authorize, requireRoles } = await import('./src/middleware/auth.js');
const { validate, schemas } = await import('./src/middleware/validate.js');

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
    data: { user, accessToken: token, accessTokenExpiresIn: mockEnv.JWT_EXPIRES_IN }
  });
});

// Test the admin route with our new composable guard
app.post('/api/admin/users', ...requireRoles(['Admin']), validate(schemas.register), (req, res) => {
  const { username, email, password, role } = req.validatedData;
  
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
});

// Test the middleware validation order
app.post('/test/validation-order', async (req, res) => {
  // Test that body wins over params and query
  req.params = { name: 'param-value', age: 'param-age' };
  req.query = { name: 'query-value', age: 'query-age', extra: 'query-extra' };
  req.body = { name: 'body-value', role: 'body-role' };
  
  const { z } = await import('zod');
  const testSchema = z.object({
    name: z.string(),
    age: z.string().optional(),
    extra: z.string().optional(), 
    role: z.string().optional()
  });
  
  const testValidate = validate(testSchema);
  testValidate(req, res, () => {
    res.json({
      success: true,
      validatedData: req.validatedData,
      expected: {
        name: 'body-value', // body should win
        age: 'query-age',   // query should win over params
        extra: 'query-extra', // only in query
        role: 'body-role'   // only in body
      }
    });
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Test server error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

async function runTests() {
  console.log('🧪 Running middleware and admin route tests...\n');

  const PORT = 8082;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
  });

  // Give server time to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  const baseURL = `http://localhost:${PORT}`;

  // Test 1: Get admin token
  console.log('1. Testing admin login...');
  const adminLogin = await fetch(`${baseURL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
  }).then(r => r.json());

  if (adminLogin.success) {
    console.log('   ✅ Admin login successful');
  } else {
    console.log('   ❌ Admin login failed:', adminLogin.error);
  }

  // Test 2: Get viewer token  
  console.log('\n2. Testing viewer login...');
  const viewerLogin = await fetch(`${baseURL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'viewer@example.com', password: 'viewer123' })
  }).then(r => r.json());

  if (viewerLogin.success) {
    console.log('   ✅ Viewer login successful');
  } else {
    console.log('   ❌ Viewer login failed:', viewerLogin.error);
  }

  // Test 3: POST /api/admin/users without token (401)
  console.log('\n3. Testing admin route without token...');
  const noTokenResult = await fetch(`${baseURL}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'test', email: 'test@example.com', password: 'Test123456' })
  });
  const noTokenData = await noTokenResult.json();

  if (noTokenResult.status === 401) {
    console.log('   ✅ 401 Unauthorized returned correctly');
  } else {
    console.log('   ❌ Expected 401, got:', noTokenResult.status, noTokenData);
  }

  // Test 4: POST /api/admin/users with viewer token (403)
  if (viewerLogin.success) {
    console.log('\n4. Testing admin route with viewer token...');
    const viewerResult = await fetch(`${baseURL}/api/admin/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${viewerLogin.data.accessToken}`
      },
      body: JSON.stringify({ username: 'test', email: 'test@example.com', password: 'Test123456' })
    });
    const viewerData = await viewerResult.json();

    if (viewerResult.status === 403) {
      console.log('   ✅ 403 Forbidden returned correctly');
    } else {
      console.log('   ❌ Expected 403, got:', viewerResult.status, viewerData);
    }
  }

  // Test 5: POST /api/admin/users with admin token and invalid data (400)
  if (adminLogin.success) {
    console.log('\n5. Testing admin route with invalid data...');
    const invalidResult = await fetch(`${baseURL}/api/admin/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminLogin.data.accessToken}`
      },
      body: JSON.stringify({ username: 'ab', email: 'invalid-email', password: '123' })
    });
    const invalidData = await invalidResult.json();

    if (invalidResult.status === 400) {
      console.log('   ✅ 400 Bad Request returned correctly');
      console.log(`   📝 Validation errors: ${invalidData.details?.length || 0}`);
    } else {
      console.log('   ❌ Expected 400, got:', invalidResult.status, invalidData);
    }
  }

  // Test 6: POST /api/admin/users with admin token and valid data (201)
  if (adminLogin.success) {
    console.log('\n6. Testing admin route with valid data...');
    const validResult = await fetch(`${baseURL}/api/admin/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminLogin.data.accessToken}`
      },
      body: JSON.stringify({ 
        username: 'newuser', 
        email: 'newuser@example.com', 
        password: 'NewPass123',
        role: 'Viewer'
      })
    });
    const validData = await validResult.json();

    if (validResult.status === 201) {
      console.log('   ✅ 201 Created returned correctly');
      console.log(`   👤 User created: ${validData.data?.user?.username}`);
    } else {
      console.log('   ❌ Expected 201, got:', validResult.status, validData);
    }
  }

  // Test 7: Validation merge order
  console.log('\n7. Testing validation merge order...');
  const mergeResult = await fetch(`${baseURL}/test/validation-order?name=query-value&age=query-age&extra=query-extra`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'body-value', role: 'body-role' })
  });
  const mergeData = await mergeResult.json();

  if (mergeData.success && mergeData.validatedData.name === 'body-value') {
    console.log('   ✅ Body wins over query/params correctly');
    console.log('   📊 Validated data:', mergeData.validatedData);
  } else {
    console.log('   ❌ Validation merge order incorrect:', mergeData);
  }

  console.log('\n🎉 Middleware and admin route tests completed!');
  
  server.close();
}

// Handle imports that might fail
try {
  await runTests();
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}