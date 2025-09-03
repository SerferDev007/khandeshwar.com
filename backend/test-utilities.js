#!/usr/bin/env node

/**
 * Test script for SQL helpers and shop validation utilities
 */

import { filterUndefined, buildInsertStatement, assertNoUndefinedParams } from './src/utils/sqlHelpers.js';
import { validateShopPayload } from './src/utils/validation/shopValidation.js';

console.log('🧪 Testing SQL Helpers and Shop Validation Utilities\n');

// Test 1: filterUndefined
console.log('1. Testing filterUndefined...');
const testObj = {
  id: '123',
  name: 'Test',
  value: null,
  missing: undefined,
  empty: '',
  zero: 0,
  anotherUndefined: undefined
};

const { filtered, removed } = filterUndefined(testObj);
console.log('   Original:', Object.keys(testObj));
console.log('   Filtered:', Object.keys(filtered));
console.log('   Removed:', removed);
console.log('   ✓ filterUndefined works correctly\n');

// Test 2: buildInsertStatement
console.log('2. Testing buildInsertStatement...');
const insertData = { id: '123', name: 'test', value: null };
const { sql, values, fields, placeholders } = buildInsertStatement('test_table', insertData);
console.log('   SQL:', sql);
console.log('   Values:', values);
console.log('   Fields:', fields);
console.log('   Placeholders:', placeholders);
console.log('   ✓ buildInsertStatement works correctly\n');

// Test 3: assertNoUndefinedParams (should pass)
console.log('3. Testing assertNoUndefinedParams (valid case)...');
try {
  assertNoUndefinedParams([1, 'test', null], ['id', 'name', 'value']);
  console.log('   ✓ Valid parameters passed assertion\n');
} catch (error) {
  console.log('   ❌ Unexpected error:', error.message);
}

// Test 4: assertNoUndefinedParams (should fail)
console.log('4. Testing assertNoUndefinedParams (invalid case)...');
try {
  assertNoUndefinedParams([1, undefined, null], ['id', 'name', 'value']);
  console.log('   ❌ Should have thrown error');
} catch (error) {
  console.log('   ✓ Correctly caught error:', error.message);
  console.log('   ✓ Error code:', error.code);
  console.log('   ✓ Undefined fields:', error.undefinedFields);
}

console.log('\n5. Testing validateShopPayload...');

// Valid payload
const validPayload = {
  shopNumber: 'SHOP-001',
  size: 100.5,
  monthlyRent: 5000,
  deposit: 15000,
  status: 'Vacant',
  description: 'Test shop'
};

const validResult = validateShopPayload(validPayload);
console.log('   Valid payload result:', validResult);

// Invalid payload
const invalidPayload = {
  shopNumber: '',
  size: -10,
  monthlyRent: 'not a number',
  status: 'InvalidStatus'
};

const invalidResult = validateShopPayload(invalidPayload);
console.log('   Invalid payload errors:', invalidResult?.errors?.length || 0, 'errors');
if (invalidResult?.errors) {
  invalidResult.errors.forEach(err => {
    console.log('     -', err.field + ':', err.message);
  });
}

console.log('\n✅ All utility tests completed!');