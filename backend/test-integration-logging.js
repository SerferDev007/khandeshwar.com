#!/usr/bin/env node

/**
 * Integration test for route activity logging
 * Tests the middleware with actual server routes
 */

import express from 'express';
import { activityLogger } from './src/middleware/activityLogger.js';

console.log('🧪 Testing Route Activity Logging Integration...\n');

// Create a minimal express app for testing
const app = express();

// Apply middleware
app.use(express.json());
app.use(activityLogger);

// Test routes
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test route worked!', timestamp: new Date().toISOString() });
});

app.post('/api/users', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'Username required' });
  }
  res.status(201).json({ 
    success: true, 
    data: { id: '123', username: username, created: true }
  });
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: { id, username: 'testuser', role: 'User', status: 'Active' }
  });
});

// Error route for testing error logging
app.get('/api/error', (req, res, next) => {
  const error = new Error('Test error for logging');
  error.code = 'TEST_ERROR';
  error.status = 500;
  next(error);
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    error: err.message,
    code: err.code
  });
});

const PORT = 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  
  // Run integration tests
  runIntegrationTests();
});

async function runIntegrationTests() {
  const baseUrl = `http://localhost:${PORT}`;
  
  try {
    // Import fetch for making requests
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n1. Testing GET request to /api/test...');
    const response1 = await fetch(`${baseUrl}/api/test`);
    const data1 = await response1.json();
    console.log('   Response:', JSON.stringify(data1, null, 2));
    
    console.log('\n2. Testing POST request to /api/users...');
    const response2 = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'secret123', email: 'test@example.com' })
    });
    const data2 = await response2.json();
    console.log('   Response:', JSON.stringify(data2, null, 2));
    
    console.log('\n3. Testing GET request with parameters /api/users/123...');
    const response3 = await fetch(`${baseUrl}/api/users/123?include=profile&sort=name`);
    const data3 = await response3.json();
    console.log('   Response:', JSON.stringify(data3, null, 2));
    
    console.log('\n4. Testing error route /api/error...');
    const response4 = await fetch(`${baseUrl}/api/error`);
    const data4 = await response4.json();
    console.log('   Response:', JSON.stringify(data4, null, 2));
    
    console.log('\n✅ Integration tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  } finally {
    console.log('\n🔚 Shutting down test server...');
    server.close();
  }
}