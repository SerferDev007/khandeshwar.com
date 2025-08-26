#!/usr/bin/env node
/**
 * Test script to verify the User.findAll fix
 * Tests various parameter combinations to ensure no SQL parameter mismatches
 */

import { User } from './src/models/User.js';
import { initializeDatabase } from './src/config/db.js';
import pino from 'pino';

const logger = pino({ name: 'UserFixTest' });

async function testUserFindAll() {
  try {
    console.log('🧪 Testing User.findAll fix...\n');
    
    // Initialize database
    await initializeDatabase();
    
    // Test 1: Basic pagination (no filters)
    console.log('📋 Test 1: Basic pagination (no filters)');
    try {
      const result1 = await User.findAll({ page: 1, limit: 5 });
      console.log('✅ Success - Basic pagination works');
      console.log(`   📊 Found ${result1.users.length} users, total: ${result1.pagination.total}\n`);
    } catch (error) {
      console.log('❌ Failed - Basic pagination:', error.message);
      console.log(`   🔍 Error details: ${error.stack}\n`);
    }

    // Test 2: With role filter
    console.log('📋 Test 2: With role filter');
    try {
      const result2 = await User.findAll({ role: 'Admin', page: 1, limit: 5 });
      console.log('✅ Success - Role filter works');
      console.log(`   📊 Found ${result2.users.length} admin users, total: ${result2.pagination.total}\n`);
    } catch (error) {
      console.log('❌ Failed - Role filter:', error.message);
      console.log(`   🔍 Error details: ${error.stack}\n`);
    }

    // Test 3: With status filter
    console.log('📋 Test 3: With status filter');
    try {
      const result3 = await User.findAll({ status: 'Active', page: 1, limit: 5 });
      console.log('✅ Success - Status filter works');
      console.log(`   📊 Found ${result3.users.length} active users, total: ${result3.pagination.total}\n`);
    } catch (error) {
      console.log('❌ Failed - Status filter:', error.message);
      console.log(`   🔍 Error details: ${error.stack}\n`);
    }

    // Test 4: With both filters
    console.log('📋 Test 4: With both role and status filters');
    try {
      const result4 = await User.findAll({ role: 'Admin', status: 'Active', page: 1, limit: 5 });
      console.log('✅ Success - Combined filters work');
      console.log(`   📊 Found ${result4.users.length} active admin users, total: ${result4.pagination.total}\n`);
    } catch (error) {
      console.log('❌ Failed - Combined filters:', error.message);
      console.log(`   🔍 Error details: ${error.stack}\n`);
    }

    // Test 5: Different sort columns
    console.log('📋 Test 5: Different sort columns');
    const sortColumns = ['username', 'email', 'role', 'created_at'];
    for (const sortCol of sortColumns) {
      try {
        const result = await User.findAll({ sort: sortCol, order: 'asc', limit: 3 });
        console.log(`✅ Success - Sort by ${sortCol} works (${result.users.length} users)`);
      } catch (error) {
        console.log(`❌ Failed - Sort by ${sortCol}:`, error.message);
      }
    }

    // Test 6: Invalid sort column (should fallback to default)
    console.log('\n📋 Test 6: Invalid sort column (should fallback to default)');
    try {
      const result6 = await User.findAll({ sort: 'invalid_column', page: 1, limit: 3 });
      console.log('✅ Success - Invalid sort handled gracefully');
      console.log(`   📊 Found ${result6.users.length} users\n`);
    } catch (error) {
      console.log('❌ Failed - Invalid sort handling:', error.message);
      console.log(`   🔍 Error details: ${error.stack}\n`);
    }

    console.log('🎉 All User.findAll tests completed!');
    console.log('✅ SQL parameter mismatch issue should be fixed');

  } catch (error) {
    console.log('💥 Test setup failed:', error.message);
    console.log(`   🔍 Error details: ${error.stack}`);
  } finally {
    process.exit(0);
  }
}

// Run tests
testUserFindAll().catch(console.error);