#!/usr/bin/env node

/**
 * Test script to demonstrate enhanced error logging functionality
 * This simulates database errors and shows detailed error information
 */

import { v4 as uuidv4 } from 'uuid';

// Mock request and response objects
const mockRequest = {
  method: 'GET',
  url: '/api/users?page=1&limit=10',
  headers: {
    'user-agent': 'Test-Client/1.0',
  },
  ip: '127.0.0.1',
  user: {
    id: 'test-user-123',
    role: 'Admin'
  },
  query: {
    page: '1',
    limit: '10'
  }
};

const mockResponse = {
  status: (code) => ({ json: (data) => console.log(`Response ${code}:`, JSON.stringify(data, null, 2)) }),
  json: (data) => console.log('Response 200:', JSON.stringify(data, null, 2))
};

// Mock User.findAll method that throws different types of database errors
class MockUserWithErrors {
  static async findAll(options = {}, requestId = null) {
    const reqId = requestId || 'no-req-id';
    console.log(`[${new Date().toISOString()}] [DB-MODEL] [${reqId}] 🔍 User.findAll called with options:`, options);
    
    const {
      page = 1,
      limit = 10,
      sort = "created_at",
      order = "desc",
    } = options;

    console.log(`[${new Date().toISOString()}] [DB-PARAMS] [${reqId}] 📊 Calculated parameters:`, {
      page,
      limit,
      sort,
      order
    });

    try {
      // Simulate different types of database errors
      const errorType = Math.random();
      
      if (errorType < 0.3) {
        // Connection error
        const error = new Error('Connection lost: The server closed the connection.');
        error.code = 'ECONNRESET';
        error.errno = 4077;
        error.sqlState = 'HY000';
        console.log(`[${new Date().toISOString()}] [DB-ERROR] [${reqId}] ❌ Connection error simulated`);
        throw error;
      } else if (errorType < 0.6) {
        // SQL syntax error
        const error = new Error('You have an error in your SQL syntax');
        error.code = 'ER_PARSE_ERROR';
        error.errno = 1064;
        error.sqlState = '42000';
        error.sqlMessage = 'You have an error in your SQL syntax near ORDER BY invalid_column';
        console.log(`[${new Date().toISOString()}] [DB-ERROR] [${reqId}] ❌ SQL syntax error simulated`);
        throw error;
      } else if (errorType < 0.8) {
        // Table doesn't exist
        const error = new Error("Table 'khandeshwar_db.users' doesn't exist");
        error.code = 'ER_NO_SUCH_TABLE';
        error.errno = 1146;
        error.sqlState = '42S02';
        console.log(`[${new Date().toISOString()}] [DB-ERROR] [${reqId}] ❌ Table not found error simulated`);
        throw error;
      } else {
        // Timeout error
        const error = new Error('Query execution was interrupted, maximum statement execution time exceeded');
        error.code = 'ER_QUERY_TIMEOUT';
        error.errno = 3024;
        error.sqlState = 'HY000';
        console.log(`[${new Date().toISOString()}] [DB-ERROR] [${reqId}] ❌ Query timeout error simulated`);
        throw error;
      }
    } catch (error) {
      console.log(`[${new Date().toISOString()}] [DB-ERROR] [${reqId}] ❌ User.findAll failed:`, {
        name: error.name,
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        errno: error.errno,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });

      throw error;
    }
  }
}

// Mock getAllUsers controller with enhanced error logging
async function mockGetAllUsersWithErrors(req, res) {
  // Generate unique request ID for tracking
  const requestId = uuidv4().substring(0, 8);
  const startTime = Date.now();
  
  console.log(`[${new Date().toISOString()}] [USER-API] [${requestId}] 🔍 Starting getAllUsers request`);
  console.log(`[${new Date().toISOString()}] [REQUEST] [${requestId}] 📋 Request details:`, {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: req.user?.id,
    userRole: req.user?.role
  });

  try {
    const q = req.query ?? {};
    const rawPage = q.page ?? 1;
    const rawLimit = q.limit ?? 10;

    console.log(`[${new Date().toISOString()}] [PARAMS] [${requestId}] 📥 Raw parameters:`, {
      page: rawPage,
      limit: rawLimit
    });

    // Safety sanitize
    const safeOptions = {
      page: Math.max(1, parseInt(rawPage, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 10)),
    };

    console.log(`[${new Date().toISOString()}] [SANITIZED] [${requestId}] ✅ Sanitized parameters:`, safeOptions);
    console.log(`[${new Date().toISOString()}] [MODEL-CALL] [${requestId}] 📤 Calling User.findAll with options:`, safeOptions);
    
    // This will throw an error
    const result = await MockUserWithErrors.findAll(safeOptions, requestId);

    // This code won't be reached due to the error above
    console.log(`[${new Date().toISOString()}] [SUCCESS] [${requestId}] ✅ getAllUsers completed successfully`);
    return res.json({ success: true, data: result });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [ERROR] [${requestId}] ❌ getAllUsers failed after ${processingTime}ms`);
    console.log(`[${new Date().toISOString()}] [ERROR-DETAILS] [${requestId}] 🔍 Error information:`, {
      name: error.name,
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });

    // Log additional context for specific error types
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      console.log(`[${new Date().toISOString()}] [ERROR-CONTEXT] [${requestId}] 🔍 Database connection issue detected`);
    } else if (error.code?.startsWith('ER_')) {
      console.log(`[${new Date().toISOString()}] [ERROR-CONTEXT] [${requestId}] 🔍 MySQL error detected - Code: ${error.code}, State: ${error.sqlState}`);
    }

    return res.status(500).json({
      success: false,
      error: "Failed to load users. Please try again.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Run multiple error scenarios
console.log('='.repeat(80));
console.log('🚨 ENHANCED ERROR LOGGING TEST');
console.log('='.repeat(80));
console.log('');

async function runErrorTests() {
  console.log('📋 Testing various database error scenarios...');
  console.log('');

  for (let i = 1; i <= 5; i++) {
    console.log(`--- Test ${i}/5 ---`);
    await mockGetAllUsersWithErrors(mockRequest, mockResponse);
    console.log('');
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Error logging tests completed');
}

runErrorTests();