/**
 * Test backend health endpoint and shops/agreements endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8081';

async function testHealthEndpoint() {
  console.log('🏥 Testing health endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    console.log('✅ Health endpoint response:', {
      status: response.status,
      ok: data.ok,
      timestamp: data.timestamp
    });
    
    return response.ok;
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.message);
    return false;
  }
}

async function testShopsEndpoint() {
  console.log('🏪 Testing shops endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/shops`);
    const data = await response.json();
    
    console.log('📊 Shops endpoint response:', {
      status: response.status,
      success: data.success,
      hasData: !!data.data,
      itemsCount: data.data?.items?.length || 0,
      total: data.data?.total || 0
    });
    
    if (response.status === 401) {
      console.log('🔐 Got 401 as expected (authentication required)');
      return true;
    }
    
    return response.status === 200 && data.success;
  } catch (error) {
    console.error('❌ Shops endpoint failed:', error.message);
    return false;
  }
}

async function testAgreementsEndpoint() {
  console.log('📋 Testing agreements endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/rent/agreements`);
    const data = await response.json();
    
    console.log('📊 Agreements endpoint response:', {
      status: response.status,
      success: data.success,
      hasData: !!data.data,
      itemsCount: data.data?.items?.length || 0,
      total: data.data?.total || 0
    });
    
    if (response.status === 401) {
      console.log('🔐 Got 401 as expected (authentication required)');
      return true;
    }
    
    return response.status === 200 && data.success;
  } catch (error) {
    console.error('❌ Agreements endpoint failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting backend endpoint tests...\n');
  
  const results = {
    health: await testHealthEndpoint(),
    shops: await testShopsEndpoint(),
    agreements: await testAgreementsEndpoint()
  };
  
  console.log('\n📊 Test Results:', results);
  
  const allPassed = Object.values(results).every(result => result);
  console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed');
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(console.error);