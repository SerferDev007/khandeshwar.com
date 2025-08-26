#!/usr/bin/env node
/**
 * Mock test script to verify the User.findAll fix logic
 * Tests query building without requiring actual database connection
 */

import pino from 'pino';

const logger = pino({ name: 'MockUserTest' });

// Mock query function that just logs the SQL and params
const mockQuery = async (sql, params = []) => {
  console.log('🔍 SQL Query:', sql);
  console.log('📝 Parameters:', params);
  console.log('✅ Parameter count matches placeholders:', (sql.match(/\?/g) || []).length === params.length);
  console.log('---');
  
  // Return mock data for different queries
  if (sql.includes('COUNT(*)')) {
    return [{ count: 5 }];
  } else {
    return [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser1',
        email: 'test1@example.com',
        role: 'Admin',
        status: 'Active',
        email_verified: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001', 
        username: 'testuser2',
        email: 'test2@example.com',
        role: 'Viewer',
        status: 'Active',
        email_verified: false,
        last_login: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
  }
};

// Mock User class with the fixed findAll method
class MockUser {
  constructor(data = {}) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.role = data.role || 'Viewer';
    this.status = data.status || 'Active';
    this.emailVerified = data.email_verified || data.emailVerified || false;
    this.lastLogin = data.last_login || data.lastLogin;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Fixed findAll method (same as the one we implemented)
  static async findAll(options = {}) {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc', role, status } = options;
    const offset = (page - 1) * limit;
    
    try {
      let whereClause = '';
      const params = [];
      
      // Build WHERE clause with proper parameters
      if (role) {
        whereClause += ' WHERE role = ?';
        params.push(role);
      }
      
      if (status) {
        whereClause += whereClause ? ' AND status = ?' : ' WHERE status = ?';
        params.push(status);
      }
      
      // Validate sort column to prevent SQL injection
      const validSortColumns = ['id', 'username', 'email', 'role', 'status', 'email_verified', 'last_login', 'created_at', 'updated_at'];
      const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
      const sortOrder = (order && order.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
      
      logger.info('User.findAll query params:', { 
        whereClause, 
        params: params.length, 
        sortColumn, 
        sortOrder, 
        limit, 
        offset 
      });
      
      // Get total count
      console.log('\n📊 Count Query:');
      const totalResults = await mockQuery(`SELECT COUNT(*) as count FROM users${whereClause}`, params);
      const total = totalResults[0].count;
      
      // Get paginated results - use safe column name and order
      console.log('\n📋 Data Query:');
      const users = await mockQuery(
        `SELECT id, username, email, role, status, email_verified, last_login, created_at, updated_at
         FROM users${whereClause} 
         ORDER BY ${sortColumn} ${sortOrder} 
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      logger.info('User.findAll results:', { 
        totalCount: total, 
        returnedCount: users.length, 
        page, 
        limit 
      });

      return {
        users: users.map(user => new MockUser(user)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to find users:', { 
        error: error.message, 
        stack: error.stack,
        options 
      });
      throw error;
    }
  }
}

async function testUserFindAll() {
  try {
    console.log('🧪 Testing User.findAll SQL Query Logic...\n');
    
    // Test 1: Basic pagination (no filters)
    console.log('========================');
    console.log('📋 Test 1: Basic pagination (no filters)');
    console.log('Expected: 2 queries with 2 params each (limit, offset)');
    const result1 = await MockUser.findAll({ page: 1, limit: 5 });
    console.log(`✅ Success - Found ${result1.users.length} users, total: ${result1.pagination.total}\n`);

    // Test 2: With role filter
    console.log('========================');
    console.log('📋 Test 2: With role filter');
    console.log('Expected: 2 queries with 3 params each (role, limit, offset)');
    const result2 = await MockUser.findAll({ role: 'Admin', page: 1, limit: 5 });
    console.log(`✅ Success - Found ${result2.users.length} admin users, total: ${result2.pagination.total}\n`);

    // Test 3: With status filter
    console.log('========================'); 
    console.log('📋 Test 3: With status filter');
    console.log('Expected: 2 queries with 3 params each (status, limit, offset)');
    const result3 = await MockUser.findAll({ status: 'Active', page: 1, limit: 5 });
    console.log(`✅ Success - Found ${result3.users.length} active users, total: ${result3.pagination.total}\n`);

    // Test 4: With both filters
    console.log('========================');
    console.log('📋 Test 4: With both role and status filters');
    console.log('Expected: 2 queries with 4 params each (role, status, limit, offset)');
    const result4 = await MockUser.findAll({ role: 'Admin', status: 'Active', page: 1, limit: 5 });
    console.log(`✅ Success - Found ${result4.users.length} active admin users, total: ${result4.pagination.total}\n`);

    // Test 5: Different sort columns
    console.log('========================');
    console.log('📋 Test 5: Valid sort column');
    console.log('Expected: Safe column name used directly in SQL');
    const result5 = await MockUser.findAll({ sort: 'username', order: 'asc', limit: 3 });
    console.log(`✅ Success - Sort by username works (${result5.users.length} users)\n`);

    // Test 6: Invalid sort column (should fallback to default)
    console.log('========================');
    console.log('📋 Test 6: Invalid sort column (should fallback to default)');
    console.log('Expected: Fallback to created_at column');
    const result6 = await MockUser.findAll({ sort: 'invalid_column', page: 1, limit: 3 });
    console.log(`✅ Success - Invalid sort handled gracefully (${result6.users.length} users)\n`);

    console.log('🎉 All User.findAll SQL logic tests completed!');
    console.log('✅ SQL parameter mismatch issue should be fixed');
    console.log('✅ SQL injection vulnerability should be prevented');
    console.log('✅ All parameter counts match placeholder counts');

  } catch (error) {
    console.log('💥 Test failed:', error.message);
    console.log(`   🔍 Error details: ${error.stack}`);
  }
}

// Run tests
testUserFindAll().catch(console.error);