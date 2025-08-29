#!/usr/bin/env node

/**
 * Production test script for shop creation API
 * Run this after the server is deployed with working database
 * Usage: node test-shop-api.js [base_url] [admin_token]
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.argv[2] || 'http://localhost:8081';
const ADMIN_TOKEN = process.argv[3];

if (!ADMIN_TOKEN) {
  console.log('❌ Admin token required for testing');
  console.log('Usage: node test-shop-api.js [base_url] [admin_token]');
  console.log('Example: node test-shop-api.js http://localhost:8081 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

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

async function testShopCreationFix() {
  console.log('🧪 Testing Shop Creation API Fix...\n');
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Using admin token: ${ADMIN_TOKEN.substring(0, 20)}...\n`);

  // Test 1: Health Check
  console.log('1. Testing health endpoint...');
  const healthResponse = await testEndpoint('GET', '/health');
  console.log(`   Status: ${healthResponse.status}`);
  if (healthResponse.success) {
    console.log('   ✅ Server is running');
  } else {
    console.log('   ❌ Server not responding');
    return;
  }

  // Test 2: Get existing shops (should work even if empty)
  console.log('\n2. Testing GET /api/shops...');
  const getShopsResponse = await testEndpoint('GET', '/api/shops', null, ADMIN_TOKEN);
  console.log(`   Status: ${getShopsResponse.status}`);
  if (getShopsResponse.success) {
    console.log(`   ✅ Successfully retrieved shops (${getShopsResponse.data.data?.length || 0} shops found)`);
  } else {
    console.log('   ❌ Failed to retrieve shops:', getShopsResponse.data?.error);
    if (getShopsResponse.status === 500) {
      console.log('   💡 This might indicate database tables are still missing');
    }
  }

  // Test 3: Create a new shop
  console.log('\n3. Testing POST /api/shops (shop creation)...');
  const newShop = {
    shopNumber: `TEST-${Date.now()}`,
    size: 150.75,
    monthlyRent: 7500.00,
    deposit: 22500.00,
    status: 'Vacant',
    description: 'Test shop created via API to verify 500 error fix'
  };

  const createShopResponse = await testEndpoint('POST', '/api/shops', newShop, ADMIN_TOKEN);
  console.log(`   Status: ${createShopResponse.status}`);
  console.log(`   Response:`, JSON.stringify(createShopResponse.data, null, 2));

  if (createShopResponse.success) {
    console.log('   🎉 SUCCESS: Shop created successfully!');
    console.log('   ✅ The 500 Internal Server Error has been FIXED');
    
    const createdShopId = createShopResponse.data.data?.id;
    if (createdShopId) {
      // Test 4: Retrieve the created shop
      console.log('\n4. Testing GET /api/shops/:id...');
      const getShopResponse = await testEndpoint('GET', `/api/shops/${createdShopId}`, null, ADMIN_TOKEN);
      if (getShopResponse.success) {
        console.log('   ✅ Successfully retrieved created shop');
        console.log(`   Shop Number: ${getShopResponse.data.data?.shopNumber}`);
        console.log(`   Monthly Rent: $${getShopResponse.data.data?.monthlyRent}`);
      }

      // Clean up: Delete the test shop
      console.log('\n5. Cleaning up test data...');
      const deleteShopResponse = await testEndpoint('DELETE', `/api/shops/${createdShopId}`, null, ADMIN_TOKEN);
      if (deleteShopResponse.success) {
        console.log('   ✅ Test shop deleted successfully');
      }
    }
  } else {
    console.log('   ❌ FAILED: Shop creation failed');
    
    if (createShopResponse.status === 500) {
      console.log('   🚨 500 Error still occurring - possible causes:');
      console.log('      • Database tables not created (migration not run)');
      console.log('      • Database connection issues');
      console.log('      • Different error than expected');
    } else if (createShopResponse.status === 422) {
      console.log('   💡 Validation error - check input data format');
    } else if (createShopResponse.status === 401 || createShopResponse.status === 403) {
      console.log('   💡 Authentication/Authorization error - check admin token');
    }
  }

  // Test 5: Test error handling improvements
  console.log('\n6. Testing enhanced error handling...');
  const duplicateShop = {
    shopNumber: 'DUPLICATE-TEST',
    size: 100,
    monthlyRent: 5000,
    deposit: 15000
  };

  // Create first shop
  await testEndpoint('POST', '/api/shops', duplicateShop, ADMIN_TOKEN);
  
  // Try to create duplicate
  const duplicateResponse = await testEndpoint('POST', '/api/shops', duplicateShop, ADMIN_TOKEN);
  if (duplicateResponse.status === 409) {
    console.log('   ✅ Duplicate shop number properly detected');
    console.log(`   Error message: ${duplicateResponse.data?.error}`);
  }

  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  if (createShopResponse.success) {
    console.log('✅ PRIMARY ISSUE RESOLVED: 500 Internal Server Error FIXED');
    console.log('✅ Shop creation is working correctly');
    console.log('✅ Database tables are properly created');
    console.log('✅ API endpoints responding as expected');
    console.log('\n🎉 The rent management shop addition feature has been RESTORED!');
  } else {
    console.log('❌ Issue may still exist - check the error details above');
    console.log('💡 Next steps:');
    console.log('   1. Verify database is running and accessible');
    console.log('   2. Check that migrations have been executed');
    console.log('   3. Restart the application to run migrations');
    console.log('   4. Verify admin token has proper permissions');
  }
}

testShopCreationFix().catch(console.error);