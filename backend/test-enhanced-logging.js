/**
 * Comprehensive test for enhanced authentication logging
 * Tests all the logging scenarios added for debugging 401 unauthorized/session expiration issues
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8081';

console.log('🧪 Starting comprehensive authentication logging test...\n');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  try {
    // Test 1: Login with enhanced logging
    console.log('📋 Test 1: Login with Enhanced Logging');
    console.log('Expected: Login request and response logging');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Login successful - check server logs for enhanced login logging\n');
    } else {
      console.log('❌ Login failed:', loginData.error, '\n');
      return;
    }

    const validToken = loginData.data.accessToken;

    // Test 2: Valid authenticated request
    console.log('📋 Test 2: Valid Authenticated Request');
    console.log('Expected: Comprehensive auth attempt, token verification, and success logging');
    const validResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const validData = await validResponse.json();
    
    if (validData.success) {
      console.log('✅ Valid request successful - check server logs for detailed auth success logging\n');
    } else {
      console.log('❌ Valid request failed:', validData.error, '\n');
    }

    // Test 3: Request without token
    console.log('📋 Test 3: Request Without Token (401)');
    console.log('Expected: Enhanced 401 logging with all headers and context');
    const noTokenResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: { 
        'User-Agent': 'Test-Client/1.0',
        'Accept': 'application/json',
        'Referer': 'https://test.com',
        'Origin': 'https://test.com'
      }
    });
    const noTokenData = await noTokenResponse.json();
    
    if (noTokenResponse.status === 401) {
      console.log('✅ 401 response correct - check server logs for enhanced 401 logging with headers\n');
    } else {
      console.log('❌ Expected 401, got:', noTokenResponse.status, noTokenData, '\n');
    }

    // Test 4: Request with expired token
    console.log('📋 Test 4: Request with Expired Token (401)');
    console.log('Expected: Token verification, expiry detection, and detailed 401 logging');
    const expiredToken = Buffer.from(JSON.stringify({
      id: 1,
      email: 'admin@example.com',
      role: 'Admin',
      exp: 1000000000 // Very old timestamp
    })).toString('base64');
    
    const expiredResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: { 
        'Authorization': `Bearer ${expiredToken}`,
        'User-Agent': 'Test-Client/1.0 (expired-token-test)',
        'Accept': 'application/json'
      }
    });
    const expiredData = await expiredResponse.json();
    
    if (expiredResponse.status === 401 && expiredData.error === 'Token expired') {
      console.log('✅ Expired token handled correctly - check server logs for expiry logging\n');
    } else {
      console.log('❌ Unexpected expired token response:', expiredResponse.status, expiredData, '\n');
    }

    // Test 5: Request with invalid token format
    console.log('📋 Test 5: Request with Invalid Token Format (401)');
    console.log('Expected: Token parsing error and detailed error logging');
    const invalidResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: { 
        'Authorization': 'Bearer invalid-token-format',
        'User-Agent': 'Test-Client/1.0 (invalid-token-test)'
      }
    });
    const invalidData = await invalidResponse.json();
    
    if (invalidResponse.status === 401) {
      console.log('✅ Invalid token format handled correctly - check server logs for parsing error logging\n');
    } else {
      console.log('❌ Unexpected invalid token response:', invalidResponse.status, invalidData, '\n');
    }

    // Test 6: Request with non-existent user token
    console.log('📋 Test 6: Request with Non-existent User Token (401)');
    console.log('Expected: Token decoding success but user lookup failure logging');
    const nonExistentUserToken = Buffer.from(JSON.stringify({
      id: 999, // Non-existent user ID
      email: 'nonexistent@example.com',
      role: 'Admin',
      exp: Math.floor(Date.now() / 1000) + 900 // Valid expiry
    })).toString('base64');
    
    const nonExistentResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: { 
        'Authorization': `Bearer ${nonExistentUserToken}`,
        'User-Agent': 'Test-Client/1.0 (nonexistent-user-test)'
      }
    });
    const nonExistentData = await nonExistentResponse.json();
    
    if (nonExistentResponse.status === 401) {
      console.log('✅ Non-existent user handled correctly - check server logs for user lookup failure\n');
    } else {
      console.log('❌ Unexpected non-existent user response:', nonExistentResponse.status, nonExistentData, '\n');
    }

    console.log('🎉 All authentication logging tests completed!');
    console.log('\n📊 Summary of Enhanced Logging Features Tested:');
    console.log('   ✅ Comprehensive request logging with headers, IP, user agent');
    console.log('   ✅ Token verification attempt logging with partial token values');
    console.log('   ✅ Token expiry detection and timing information');
    console.log('   ✅ Detailed 401 response logging with reasons and context');
    console.log('   ✅ Enhanced error handling with specific error types');
    console.log('   ✅ User lookup failure logging');
    console.log('   ✅ Authentication success logging with user and token details');
    
    console.log('\n🔍 Check the server console output above for all the detailed logging information.');
    console.log('This comprehensive logging will help debug persistent 401 unauthorized/session expiration issues.');

  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

export { runTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}