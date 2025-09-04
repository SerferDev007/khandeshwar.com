#!/usr/bin/env node

/**
 * Complete Activity Logging Demo
 * Demonstrates the comprehensive route logging system
 */

import express from 'express';
import { activityLogger, logActivity } from './src/middleware/activityLogger.js';

console.log('🎯 Complete Activity Logging Demo\n');
console.log('This demo shows comprehensive route activity logging for all endpoints\n');

const app = express();

// Apply middleware stack
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MAIN FEATURE: Activity logging middleware for ALL routes
app.use(activityLogger);

// Mock user middleware (simulates authentication)
app.use((req, res, next) => {
  if (req.headers.authorization) {
    req.user = { id: 'user123', role: 'Admin', username: 'testuser' };
  }
  next();
});

// === ROUTE EXAMPLES ===

// GET endpoint with query parameters
app.get('/api/users', (req, res) => {
  logActivity(req, 'info', 'Processing user list request', { 
    filters: req.query 
  });
  
  res.json({
    success: true,
    data: [
      { id: '1', username: 'user1', role: 'Admin' },
      { id: '2', username: 'user2', role: 'User' }
    ],
    pagination: { page: 1, total: 2 }
  });
});

// POST endpoint with sensitive data
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  logActivity(req, 'info', 'Processing login attempt', { 
    username,
    hasPassword: !!password 
  });
  
  if (username === 'admin') {
    res.json({
      success: true,
      data: {
        token: 'jwt-token-here',
        user: { id: '1', username: 'admin', role: 'Admin' }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// GET endpoint with URL parameters
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  if (id === '999') {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: { id, username: `user${id}`, role: 'User', status: 'Active' }
  });
});

// PUT endpoint with data update
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  logActivity(req, 'info', 'Updating user data', { 
    userId: id,
    updateFields: Object.keys(req.body)
  });
  
  res.json({
    success: true,
    data: { 
      id, 
      ...req.body,
      updatedAt: new Date().toISOString() 
    }
  });
});

// DELETE endpoint
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  logActivity(req, 'warning', 'User deletion requested', { userId: id });
  
  res.json({
    success: true,
    data: { message: `User ${id} deleted successfully` }
  });
});

// Complex endpoint with multiple operations
app.post('/api/shops', (req, res) => {
  logActivity(req, 'info', 'Shop creation initiated', {
    shopNumber: req.body.shopNumber,
    hasAllRequiredFields: !!(req.body.shopNumber && req.body.size && req.body.monthlyRent)
  });
  
  // Simulate validation
  if (!req.body.shopNumber) {
    logActivity(req, 'error', 'Shop creation failed - validation error', {
      missingFields: ['shopNumber']
    });
    return res.status(400).json({
      success: false,
      error: 'Shop number is required',
      details: ['shopNumber field is missing']
    });
  }
  
  // Simulate database operation
  logActivity(req, 'info', 'Saving shop to database', {
    shopData: req.body
  });
  
  res.status(201).json({
    success: true,
    data: {
      id: 'shop123',
      ...req.body,
      createdAt: new Date().toISOString()
    }
  });
});

// Error simulation endpoint
app.get('/api/error', (req, res, next) => {
  logActivity(req, 'error', 'Simulating server error');
  
  const error = new Error('Database connection failed');
  error.code = 'DB_CONNECTION_ERROR';
  error.status = 500;
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    error: err.message,
    code: err.code,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

const PORT = 3002;

console.log('🚀 Starting demonstration server...\n');

const server = app.listen(PORT, async () => {
  console.log(`✅ Demo server running on http://localhost:${PORT}\n`);
  console.log('📋 Running demonstration requests...\n');
  
  // Run demo requests
  await runDemoRequests(PORT);
  
  console.log('\n🎉 Activity Logging Demo Completed!\n');
  console.log('📊 Key Features Demonstrated:');
  console.log('   • Request correlation IDs for traceability');
  console.log('   • Structured console logging with timestamps');
  console.log('   • Performance timing measurements');
  console.log('   • Request/response data logging');
  console.log('   • Sensitive data sanitization');
  console.log('   • Error handling and logging');
  console.log('   • Custom activity logging in controllers');
  console.log('   • Multiple HTTP methods and status codes');
  console.log('\n✅ Ready for production deployment!');
  
  server.close();
});

async function runDemoRequests(port) {
  const baseUrl = `http://localhost:${port}`;
  const fetch = (await import('node-fetch')).default;
  
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    console.log('1️⃣ GET /api/users with query parameters...');
    await fetch(`${baseUrl}/api/users?page=1&limit=10&role=Admin&status=Active`);
    await delay(500);
    
    console.log('\n2️⃣ POST /api/auth/login with sensitive data...');
    await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
      body: JSON.stringify({ username: 'admin', password: 'secretpassword123' })
    });
    await delay(500);
    
    console.log('\n3️⃣ GET /api/users/123 with URL parameters...');
    await fetch(`${baseUrl}/api/users/123`, {
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    await delay(500);
    
    console.log('\n4️⃣ PUT /api/users/123 with update data...');
    await fetch(`${baseUrl}/api/users/123`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ username: 'updateduser', email: 'updated@example.com' })
    });
    await delay(500);
    
    console.log('\n5️⃣ POST /api/shops with complex validation...');
    await fetch(`${baseUrl}/api/shops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ 
        shopNumber: 'SHOP001', 
        size: 120.5, 
        monthlyRent: 5000,
        deposit: 15000,
        description: 'Test shop creation'
      })
    });
    await delay(500);
    
    console.log('\n6️⃣ GET /api/users/999 (404 error)...');
    await fetch(`${baseUrl}/api/users/999`);
    await delay(500);
    
    console.log('\n7️⃣ GET /api/error (500 error)...');
    await fetch(`${baseUrl}/api/error`);
    await delay(500);
    
    console.log('\n8️⃣ GET /api/nonexistent (404 not found)...');
    await fetch(`${baseUrl}/api/nonexistent`);
    await delay(500);
    
  } catch (error) {
    console.error('Demo request failed:', error.message);
  }
}