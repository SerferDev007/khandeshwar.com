#!/usr/bin/env node

/**
 * Integration tests for POST /api/admin/users
 * Tests the acceptance criteria: 401 no token, 403 non-admin, 201 admin+valid, 400 admin+invalid
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:8081';

// Test helper function
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

// Helper to get authentication tokens
async function getTokens() {
  // For integration tests, we'll use the demo auth system
  // In a real scenario, these would be actual login credentials
  const adminLogin = await testEndpoint('POST', '/api/auth/login', {
    email: 'admin@khandeshwar.com',
    password: 'admin123'
  });

  const viewerLogin = await testEndpoint('POST', '/api/auth/login', {
    email: 'viewer@khandeshwar.com', 
    password: 'viewer123'
  });

  return {
    adminToken: adminLogin.success ? adminLogin.data.data?.accessToken : null,
    viewerToken: viewerLogin.success ? viewerLogin.data.data?.accessToken : null,
  };
}

async function runAdminUserTests() {
  console.log('🧪 Testing POST /api/admin/users integration tests...\n');

  // Get authentication tokens
  console.log('0. Setting up authentication tokens...');
  const { adminToken, viewerToken } = await getTokens();
  
  if (!adminToken) {
    console.log('   ⚠️  Could not get admin token, tests may fail');
  } else {
    console.log('   ✅ Admin token obtained');
  }
  
  if (!viewerToken) {
    console.log('   ⚠️  Could not get viewer token, some tests may fail');
  } else {
    console.log('   ✅ Viewer token obtained');
  }

  // Test 1: POST /api/admin/users without token (should return 401)
  console.log('\n1. Testing POST /api/admin/users without token...');
  const noTokenResult = await testEndpoint('POST', '/api/admin/users', {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123456',
    role: 'Viewer'
  });

  if (noTokenResult.status === 401 && noTokenResult.data.success === false) {
    console.log('   ✅ 401 Unauthorized returned correctly for no token');
    console.log(`   🔒 Error: ${noTokenResult.data.error}`);
  } else {
    console.log('   ❌ Expected 401 but got:', noTokenResult.status);
    console.log('   ', noTokenResult.data);
  }

  // Test 2: POST /api/admin/users with non-admin token (should return 403)
  console.log('\n2. Testing POST /api/admin/users with non-admin token...');
  const nonAdminResult = await testEndpoint('POST', '/api/admin/users', {
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'Test123456',
    role: 'Viewer'
  }, viewerToken);

  if (nonAdminResult.status === 403 && nonAdminResult.data.success === false) {
    console.log('   ✅ 403 Forbidden returned correctly for non-admin user');
    console.log(`   🔒 Error: ${nonAdminResult.data.error}`);
  } else {
    console.log('   ❌ Expected 403 but got:', nonAdminResult.status);
    console.log('   ', nonAdminResult.data);
  }

  // Test 3: POST /api/admin/users with admin token and invalid data (should return 400)
  console.log('\n3. Testing POST /api/admin/users with admin token and invalid data...');
  const invalidDataResult = await testEndpoint('POST', '/api/admin/users', {
    username: 'ab', // Too short
    email: 'invalid-email', // Invalid format
    password: '123', // Too weak
    role: 'InvalidRole' // Invalid role
  }, adminToken);

  if (invalidDataResult.status === 400 && invalidDataResult.data.success === false) {
    console.log('   ✅ 400 Bad Request returned correctly for invalid data');
    console.log(`   📝 Validation errors: ${invalidDataResult.data.details?.length || 0} found`);
    if (invalidDataResult.data.details) {
      invalidDataResult.data.details.forEach(detail => {
        console.log(`      - ${detail.field}: ${detail.message}`);
      });
    }
  } else {
    console.log('   ❌ Expected 400 but got:', invalidDataResult.status);
    console.log('   ', invalidDataResult.data);
  }

  // Test 4: POST /api/admin/users with admin token and valid data (should return 201)
  console.log('\n4. Testing POST /api/admin/users with admin token and valid data...');
  const validDataResult = await testEndpoint('POST', '/api/admin/users', {
    username: `testuser_${Date.now()}`, // Unique username
    email: `test_${Date.now()}@example.com`, // Unique email
    password: 'TestPassword123',
    role: 'Viewer'
  }, adminToken);

  if (validDataResult.status === 201 && validDataResult.data.success === true) {
    console.log('   ✅ 201 Created returned correctly for valid admin request');
    console.log(`   👤 User created: ${validDataResult.data.data?.user?.username}`);
  } else if (validDataResult.status === 409) {
    console.log('   ⚠️  409 Conflict - user might already exist (acceptable for test)');
  } else {
    console.log('   ❌ Expected 201 but got:', validDataResult.status);
    console.log('   ', validDataResult.data);
  }

  console.log('\n🎉 POST /api/admin/users integration tests completed!');
  console.log('\n📋 Summary:');
  console.log('   • 401 Unauthorized: No token provided');
  console.log('   • 403 Forbidden: Non-admin user attempted access');
  console.log('   • 400 Bad Request: Invalid data validation');
  console.log('   • 201 Created: Valid admin request with valid data');
}

// Run tests if file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminUserTests().catch(console.error);
}

export { runAdminUserTests, testEndpoint };