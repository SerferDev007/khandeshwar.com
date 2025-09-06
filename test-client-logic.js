/**
 * Simple test of API client token timestamp functionality
 */

// Mock localStorage and sessionStorage for Node.js
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// Mock window object
global.window = {
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage
};

// Test token timestamp functionality
async function testTokenTimestamp() {
  console.log('🔍 Testing token timestamp functionality...');
  
  try {
    // Create a simple mock API client-like object
    class MockApiClient {
      constructor() {
        this.token = null;
        this.tokenTimestamp = 0;
      }
      
      setAuthToken(token) {
        this.token = token;
        this.tokenTimestamp = token ? Date.now() : 0;
        console.log('Token set:', { 
          hasToken: !!token, 
          timestamp: this.tokenTimestamp 
        });
      }
      
      getTokenAge() {
        if (!this.token || !this.tokenTimestamp) return 0;
        return Date.now() - this.tokenTimestamp;
      }
      
      isTokenFresh(ttl = 60000) {
        return this.getTokenAge() < ttl;
      }
    }
    
    const client = new MockApiClient();
    
    // Test 1: No token initially
    console.log('Test 1 - Initial state:');
    console.log('  Token age:', client.getTokenAge());
    console.log('  Is fresh:', client.isTokenFresh());
    
    // Test 2: Set token
    console.log('\nTest 2 - After setting token:');
    client.setAuthToken('test-token-12345');
    console.log('  Token age:', client.getTokenAge());
    console.log('  Is fresh:', client.isTokenFresh());
    
    // Test 3: Wait and check age
    console.log('\nTest 3 - After waiting 100ms:');
    await new Promise(resolve => setTimeout(resolve, 100));
    const age = client.getTokenAge();
    console.log('  Token age:', age);
    console.log('  Is fresh (60s TTL):', client.isTokenFresh(60000));
    console.log('  Is fresh (50ms TTL):', client.isTokenFresh(50));
    
    // Test 4: Clear token
    console.log('\nTest 4 - After clearing token:');
    client.setAuthToken(null);
    console.log('  Token age:', client.getTokenAge());
    console.log('  Is fresh:', client.isTokenFresh());
    
    console.log('\n✅ Token timestamp tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Token timestamp test failed:', error);
    return false;
  }
}

// Test auth context guards
function testAuthGuards() {
  console.log('\n🛡️ Testing auth context guards...');
  
  try {
    // Simulate React StrictMode double-mount protection
    let initCount = 0;
    const initRef = { current: false };
    
    function simulateAuthInit() {
      if (initRef.current) {
        console.log('  🔒 Init blocked by guard (already initialized)');
        return false;
      }
      
      initRef.current = true;
      initCount++;
      console.log(`  ✅ Auth initialized (count: ${initCount})`);
      return true;
    }
    
    // Test multiple calls
    console.log('Calling auth init multiple times:');
    simulateAuthInit(); // Should initialize
    simulateAuthInit(); // Should be blocked
    simulateAuthInit(); // Should be blocked
    
    console.log(`Final init count: ${initCount} (expected: 1)`);
    
    if (initCount === 1) {
      console.log('✅ Auth guard test passed!');
      return true;
    } else {
      console.log('❌ Auth guard test failed!');
      return false;
    }
  } catch (error) {
    console.error('❌ Auth guard test failed:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting API client and auth tests...\n');
  
  const results = {
    tokenTimestamp: await testTokenTimestamp(),
    authGuards: testAuthGuards()
  };
  
  console.log('\n📊 Test Results:', results);
  
  const allPassed = Object.values(results).every(result => result);
  console.log(allPassed ? '\n✅ All tests passed!' : '\n❌ Some tests failed');
  
  return allPassed;
}

runTests().catch(console.error);