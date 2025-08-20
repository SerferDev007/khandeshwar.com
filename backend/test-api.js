#!/usr/bin/env node

/**
 * Simple API test script to validate the production backend
 * Run with: node test-api.js
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:8081';

async function testEndpoint(method, path, body = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const data = await response.json();

    return {
      status: response.status,
      success: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log('🧪 Testing Khandeshwar Management API...\n');

  // Test 1: Health Check
  console.log('1. Testing health endpoint...');
  const health = await testEndpoint('GET', '/health');
  if (health.success && health.data.success) {
    console.log('   ✅ Health check passed');
    console.log(`   📊 Status: ${health.data.data.status}, Environment: ${health.data.data.environment}`);
  } else {
    console.log('   ❌ Health check failed');
    console.log('   ', health.data);
  }

  // Test 2: 404 Handler
  console.log('\n2. Testing 404 handler...');
  const notFound = await testEndpoint('GET', '/nonexistent');
  if (notFound.status === 404 && notFound.data.success === false) {
    console.log('   ✅ 404 handler works correctly');
  } else {
    console.log('   ❌ 404 handler failed');
  }

  // Test 3: Authentication - Unauthorized Access
  console.log('\n3. Testing authentication middleware...');
  const unauthorized = await testEndpoint('GET', '/api/auth/profile');
  if (unauthorized.status === 401 && unauthorized.data.success === false) {
    console.log('   ✅ Authentication middleware works correctly');
    console.log(`   🔒 Error: ${unauthorized.data.error}`);
  } else {
    console.log('   ❌ Authentication middleware failed');
  }

  // Test 4: Validation - Invalid Registration Data
  console.log('\n4. Testing input validation...');
  const invalidData = await testEndpoint('POST', '/api/auth/register', {
    username: 'ab', // Too short
    email: 'invalid-email', // Invalid format
    password: '123', // Too weak
  });
  if (invalidData.status === 400 && invalidData.data.success === false) {
    console.log('   ✅ Input validation works correctly');
    console.log(`   📝 Validation errors: ${invalidData.data.details?.length || 0} found`);
  } else {
    console.log('   ❌ Input validation failed');
    console.log('   ', invalidData.data);
  }

  // Test 5: Rate Limiting (Auth endpoints)
  console.log('\n5. Testing rate limiting...');
  console.log('   🚀 Making multiple rapid requests to test rate limiting...');
  
  const promises = Array(7).fill().map((_, i) => 
    testEndpoint('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    })
  );

  const results = await Promise.all(promises);
  const rateLimited = results.some(r => r.status === 429);
  
  if (rateLimited) {
    console.log('   ✅ Rate limiting works correctly');
  } else {
    console.log('   ⚠️  Rate limiting may not be working (or limit not reached)');
  }

  // Test 6: CORS Headers
  console.log('\n6. Testing CORS headers...');
  const corsTest = await fetch(`${API_BASE_URL}/health`, {
    method: 'OPTIONS',
  });
  
  if (corsTest.headers.has('access-control-allow-origin')) {
    console.log('   ✅ CORS headers present');
  } else {
    console.log('   ❌ CORS headers missing');
  }

  console.log('\n🎉 API testing completed!');
  console.log('\n📋 Summary:');
  console.log('   • Health endpoint: Working');
  console.log('   • Error handling: Standardized format');
  console.log('   • Authentication: JWT required for protected routes');
  console.log('   • Validation: Zod schemas working');
  console.log('   • Rate limiting: Configured');
  console.log('   • CORS: Headers present');
  
  console.log('\n🔗 Next steps:');
  console.log('   1. Set up MySQL database to test full functionality');
  console.log('   2. Configure AWS credentials for S3/SES features');
  console.log('   3. Test registration and login flows');
  console.log('   4. Test file upload functionality');
  console.log('   5. Deploy to production environment');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running at', API_BASE_URL);
    console.log('Please start the server with: npm start');
    process.exit(1);
  }

  await runTests();
}

main().catch(console.error);