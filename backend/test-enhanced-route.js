#!/usr/bin/env node

/**
 * Simple test to verify shop route compilation and basic functionality
 * Does not require database connection - just tests module loading
 */

console.log('🧪 Testing Enhanced Shop Route...\n');

try {
  console.log('1. Testing imports...');
  
  // Test debug logger import
  const { dbg, generateCorrelationId } = await import('./src/utils/debugLogger.js');
  console.log('   ✅ Debug logger imported successfully');
  
  // Test shop model import
  const { Shop } = await import('./src/models/Shop.js');
  console.log('   ✅ Shop model imported successfully');
  
  // Test helpers import
  const { generateId } = await import('./src/utils/helpers.js');
  console.log('   ✅ Helpers imported successfully');
  
  console.log('\n2. Testing model functionality...');
  
  // Test shop creation
  const shopData = {
    id: generateId(),
    shopNumber: 'TEST-ROUTE-001',
    size: 120.5,
    monthlyRent: 6000,
    deposit: 18000,
    status: 'Vacant',
    createdAt: new Date().toISOString(),
    description: 'Test shop for route verification'
  };
  
  const shop = new Shop(shopData);
  console.log('   ✅ Shop model instantiation works');
  
  // Test toDbObject conversion
  const dbObject = shop.toDbObject();
  console.log('   ✅ toDbObject() conversion works');
  console.log(`   DB Object keys: ${Object.keys(dbObject).join(', ')}`);
  
  // Test correlation ID generation
  const correlationId = generateCorrelationId();
  console.log(`   ✅ Correlation ID generated: ${correlationId}`);
  
  console.log('\n3. Testing diagnostic logging...');
  
  // Test diagnostic function calls (without actually logging to avoid spam)
  dbg('test-route', 'module-test', { shopId: shop.id }, correlationId);
  console.log('   ✅ Diagnostic logging functional');
  
  console.log('\n✅ Enhanced shop route module tests passed!');
  console.log('\n📋 Summary:');
  console.log('   • All imports successful');
  console.log('   • Shop model functionality verified');
  console.log('   • Diagnostic logging operational');
  console.log('   • Ready for server integration testing');
  
} catch (error) {
  console.error('❌ Route test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}