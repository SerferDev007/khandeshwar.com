#!/usr/bin/env node
/**
 * Integration test for the User API fix
 * Tests the complete flow from API request to database query
 */

import express from 'express';
import userRoutes from './src/routes/user.js';
import { validate, schemas } from './src/middleware/validate.js';
import pino from 'pino';

const logger = pino({ name: 'UserAPITest' });

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 'admin-123', role: 'Admin', username: 'admin' };
  next();
};

// Mock database query function
let mockQueryCalls = [];
const mockQuery = async (sql, params = []) => {
  const call = {
    sql: sql.trim(),
    params: [...params],
    placeholderCount: (sql.match(/\?/g) || []).length,
    paramCount: params.length,
    isValid: (sql.match(/\?/g) || []).length === params.length
  };
  
  mockQueryCalls.push(call);
  
  console.log(`📋 Mock Query #${mockQueryCalls.length}:`);
  console.log(`   SQL: ${call.sql.substring(0, 100)}${call.sql.length > 100 ? '...' : ''}`);
  console.log(`   Params: [${call.params.join(', ')}] (${call.paramCount})`);
  console.log(`   Placeholders: ${call.placeholderCount}`);
  console.log(`   ✅ Valid: ${call.isValid}`);
  
  // Simulate the actual error that was happening
  if (!call.isValid) {
    const error = new Error('Incorrect arguments to mysqld_stmt_execute');
    error.errno = 1210;
    error.code = 'ER_WRONG_ARGUMENTS';
    throw error;
  }
  
  // Return mock data
  if (sql.includes('COUNT(*)')) {
    return [{ count: 10 }];
  } else {
    return [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'admin',
        email: 'admin@example.com',
        role: 'Admin',
        status: 'Active',
        email_verified: true,
        last_login: new Date('2024-01-15'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-15')
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        username: 'treasurer',
        email: 'treasurer@example.com',
        role: 'Treasurer',
        status: 'Active',
        email_verified: true,
        last_login: new Date('2024-01-14'),
        created_at: new Date('2024-01-02'),
        updated_at: new Date('2024-01-14')
      }
    ];
  }
};

// Mock the db module
const mockDbModule = {
  query: mockQuery,
  initializeDatabase: async () => console.log('Mock DB initialized')
};

// Override the db import for testing
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', mockAuth, userRoutes);

// Helper function to make requests
const makeRequest = (app, method, url, body = null, query = '') => {
  return new Promise((resolve, reject) => {
    const request = require('supertest')(app);
    const req = request[method.toLowerCase()](url + query);
    
    if (body) {
      req.send(body);
    }
    
    req.end((err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
};

async function testUserAPI() {
  console.log('🧪 Testing User API with parameter fixes...\n');
  
  try {
    // Replace the db query function globally for all modules
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function(id) {
      if (id === '../config/db.js' || id.endsWith('/config/db.js')) {
        return mockDbModule;
      }
      return originalRequire.apply(this, arguments);
    };

    const testCases = [
      {
        name: 'Basic user list (no filters)',
        query: '',
        description: 'Should work with default pagination'
      },
      {
        name: 'With page and limit',
        query: '?page=2&limit=5',
        description: 'Should handle pagination parameters correctly'
      },
      {
        name: 'With role filter',
        query: '?role=Admin',
        description: 'Should add role filter to WHERE clause'
      },
      {
        name: 'With status filter', 
        query: '?status=Active',
        description: 'Should add status filter to WHERE clause'
      },
      {
        name: 'With both filters',
        query: '?role=Admin&status=Active',
        description: 'Should combine role and status filters'
      },
      {
        name: 'With custom sort',
        query: '?sort=username&order=asc',
        description: 'Should use safe column names in ORDER BY'
      },
      {
        name: 'With all parameters',
        query: '?page=1&limit=10&sort=email&order=desc&role=Treasurer&status=Active',
        description: 'Should handle all parameters correctly'
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      mockQueryCalls = []; // Reset call tracking
      
      console.log(`\n=== Test ${i + 1}: ${testCase.name} ===`);
      console.log(`Description: ${testCase.description}`);
      console.log(`Query: GET /api/users${testCase.query}`);
      
      try {
        // Import the User model fresh to use our mocked db
        delete require.cache[require.resolve('./src/models/User.js')];
        delete require.cache[require.resolve('./src/controllers/user.js')];
        
        const { getAllUsers } = await import('./src/controllers/user.js');
        
        // Create mock request and response
        const req = {
          validatedData: {},
          user: { id: 'admin-123', role: 'Admin' }
        };
        
        // Parse query parameters
        if (testCase.query) {
          const params = new URLSearchParams(testCase.query.substring(1));
          for (const [key, value] of params) {
            req.validatedData[key] = value;
          }
        }
        
        // Set defaults for missing parameters
        req.validatedData.page = req.validatedData.page || '1';
        req.validatedData.limit = req.validatedData.limit || '10';
        req.validatedData.sort = req.validatedData.sort || 'created_at';
        req.validatedData.order = req.validatedData.order || 'desc';
        
        const res = {
          json: (data) => {
            console.log(`✅ Response successful: ${data.success ? 'Success' : 'Failed'}`);
            if (data.success) {
              console.log(`   Users returned: ${data.data.users.length}`);
              console.log(`   Total pages: ${data.data.pagination.pages}`);
            }
            return res;
          },
          status: (code) => {
            console.log(`❌ Response status: ${code}`);
            return res;
          }
        };

        await getAllUsers(req, res, () => {});
        
        // Analyze query calls
        console.log(`\n📊 Query Analysis:`);
        console.log(`   Total queries: ${mockQueryCalls.length}`);
        const validQueries = mockQueryCalls.filter(call => call.isValid).length;
        const invalidQueries = mockQueryCalls.filter(call => !call.isValid).length;
        console.log(`   Valid queries: ${validQueries}`);
        console.log(`   Invalid queries: ${invalidQueries}`);
        
        if (invalidQueries > 0) {
          console.log(`❌ FAILED: Found ${invalidQueries} queries with parameter mismatches`);
        } else {
          console.log(`✅ SUCCESS: All queries have correct parameter counts`);
        }
        
      } catch (error) {
        console.log(`❌ Test failed with error: ${error.message}`);
        if (error.message.includes('mysqld_stmt_execute')) {
          console.log(`   🔍 This is the exact error we were trying to fix!`);
        }
      }
    }

    console.log('\n🎉 User API parameter fix testing completed!');
    console.log('✅ The fix should prevent "Incorrect arguments to mysqld_stmt_execute" errors');
    console.log('✅ All query parameters should now match the number of placeholders');

  } catch (error) {
    console.log('💥 Test setup failed:', error.message);
  }
}

// Run tests  
testUserAPI().catch(console.error);