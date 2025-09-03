#!/usr/bin/env node

/**
 * Test script to demonstrate enhanced logging functionality
 * This simulates the /api/users endpoint behavior with mock data
 */

import { v4 as uuidv4 } from 'uuid';

// Mock request and response objects
const mockRequest = {
  method: 'GET',
  url: '/api/users?page=1&limit=10&sort=username&order=asc',
  headers: {
    'user-agent': 'Test-Client/1.0',
    'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  ip: '127.0.0.1',
  user: {
    id: 'test-user-123',
    role: 'Admin'
  },
  query: {
    page: '1',
    limit: '10',
    sort: 'username',
    order: 'asc'
  }
};

const mockResponse = {
  status: (code) => ({ json: (data) => console.log(`Response ${code}:`, JSON.stringify(data, null, 2)) }),
  json: (data) => console.log('Response 200:', JSON.stringify(data, null, 2))
};

// Mock User.findAll method with enhanced logging
class MockUser {
  static async findAll(options = {}, requestId = null) {
    const reqId = requestId || 'no-req-id';
    console.log(`[${new Date().toISOString()}] [DB-MODEL] [${reqId}] 🔍 User.findAll called with options:`, options);
    
    const {
      page = 1,
      limit = 10,
      sort = "created_at",
      order = "desc",
      role,
      status,
    } = options;
    const offset = (page - 1) * limit;

    console.log(`[${new Date().toISOString()}] [DB-PARAMS] [${reqId}] 📊 Calculated parameters:`, {
      page,
      limit,
      offset,
      sort,
      order,
      role,
      status
    });

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock WHERE clause building
    let whereClause = "";
    const params = [];

    console.log(`[${new Date().toISOString()}] [DB-WHERE] [${reqId}] 🔧 Building WHERE clause`);

    if (role) {
      whereClause += " WHERE role = ?";
      params.push(role);
      console.log(`[${new Date().toISOString()}] [DB-WHERE] [${reqId}] 📝 Added role filter:`, role);
    }

    if (status) {
      whereClause += whereClause ? " AND status = ?" : " WHERE status = ?";
      params.push(status);
      console.log(`[${new Date().toISOString()}] [DB-WHERE] [${reqId}] 📝 Added status filter:`, status);
    }

    console.log(`[${new Date().toISOString()}] [DB-WHERE] [${reqId}] ✅ Final WHERE clause:`, whereClause);
    console.log(`[${new Date().toISOString()}] [DB-WHERE] [${reqId}] 📋 Parameters:`, params);

    // Validate sort column
    const validSortColumns = [
      "id",
      "username", 
      "email",
      "role",
      "status",
      "email_verified",
      "last_login",
      "created_at",
      "updated_at",
    ];
    const sortColumn = validSortColumns.includes(sort) ? sort : "created_at";
    const sortOrder = order && order.toLowerCase() === "asc" ? "ASC" : "DESC";

    console.log(`[${new Date().toISOString()}] [DB-SORT] [${reqId}] 🔍 Sort validation:`, {
      requestedSort: sort,
      validSort: sortColumn,
      requestedOrder: order,
      finalOrder: sortOrder,
      isValidSort: validSortColumns.includes(sort)
    });

    // Mock count query
    const countQuery = `SELECT COUNT(*) as count FROM users${whereClause}`;
    console.log(`[${new Date().toISOString()}] [DB-QUERY] [${reqId}] 📤 Executing count query:`, {
      sql: countQuery,
      params: params
    });
    
    const queryStartTime = Date.now();
    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, 50));
    const countQueryTime = Date.now() - queryStartTime;
    const total = 25; // Mock total count
    
    console.log(`[${new Date().toISOString()}] [DB-RESULT] [${reqId}] 📥 Count query result:`, {
      total,
      queryTime: `${countQueryTime}ms`
    });

    // Mock data query
    const dataQuery = `SELECT id, username, email, role, status, email_verified, last_login, created_at, updated_at
   FROM users${whereClause}
   ORDER BY ${sortColumn} ${sortOrder}
   LIMIT ? OFFSET ?`;
   
    const dataParams = [...params, limit, offset];
    console.log(`[${new Date().toISOString()}] [DB-QUERY] [${reqId}] 📤 Executing data query:`, {
      sql: dataQuery,
      params: dataParams
    });
    
    const dataQueryStartTime = Date.now();
    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, 75));
    const dataQueryTime = Date.now() - dataQueryStartTime;
    
    // Mock user data
    const mockUsers = [
      {
        id: 'user-1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'Admin',
        status: 'Active',
        email_verified: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'user-2',
        username: 'treasurer',
        email: 'treasurer@example.com',
        role: 'Treasurer',
        status: 'Active',
        email_verified: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    console.log(`[${new Date().toISOString()}] [DB-RESULT] [${reqId}] 📥 Data query result:`, {
      rowCount: mockUsers.length,
      queryTime: `${dataQueryTime}ms`
    });

    const result = {
      users: mockUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    console.log(`[${new Date().toISOString()}] [DB-SUCCESS] [${reqId}] ✅ User.findAll completed successfully:`, {
      totalCount: total,
      returnedCount: mockUsers.length,
      page,
      limit,
      totalPages: result.pagination.pages,
      totalQueryTime: `${countQueryTime + dataQueryTime}ms`
    });

    return result;
  }
}

// Mock getAllUsers controller with enhanced logging
async function mockGetAllUsers(req, res) {
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
    const rawSort = q.sort ?? "created_at";
    const rawOrder = q.order ?? "desc";
    const rawRole = q.role;
    const rawStatus = q.status;

    console.log(`[${new Date().toISOString()}] [PARAMS] [${requestId}] 📥 Raw parameters:`, {
      page: rawPage,
      limit: rawLimit,
      sort: rawSort,
      order: rawOrder,
      role: rawRole,
      status: rawStatus
    });

    // Safety sanitize
    const safeOptions = {
      page: Math.max(1, parseInt(rawPage, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 10)),
      sort: [
        "created_at",
        "username",
        "email",
        "role",
        "status",
        "last_login",
      ].includes(String(rawSort))
        ? String(rawSort)
        : "created_at",
      order:
        String(rawOrder).toLowerCase() === "asc" ||
        String(rawOrder).toLowerCase() === "desc"
          ? String(rawOrder).toLowerCase()
          : "desc",
    };

    if (rawRole && ["Admin", "Treasurer", "Viewer"].includes(rawRole)) {
      safeOptions.role = rawRole;
    }
    if (rawStatus && ["Active", "Inactive"].includes(rawStatus)) {
      safeOptions.status = rawStatus;
    }

    console.log(`[${new Date().toISOString()}] [SANITIZED] [${requestId}] ✅ Sanitized parameters:`, safeOptions);
    console.log(`[${new Date().toISOString()}] [MODEL-CALL] [${requestId}] 📤 Calling User.findAll with options:`, safeOptions);
    
    // Call model
    const result = await MockUser.findAll(safeOptions, requestId);

    console.log(`[${new Date().toISOString()}] [MODEL-RESULT] [${requestId}] 📥 User.findAll result:`, {
      resultExists: !!result,
      resultType: typeof result,
      hasUsers: !!result?.users,
      usersIsArray: Array.isArray(result?.users),
      usersCount: result?.users?.length || 0,
      hasPagination: !!result?.pagination
    });

    if (!result || typeof result !== "object") {
      console.log(`[${new Date().toISOString()}] [ERROR] [${requestId}] ❌ User.findAll returned unexpected value`);
      return res.status(500).json({
        success: false,
        error: "Failed to load users. Please try again.",
      });
    }

    const users = Array.isArray(result.users) ? result.users : [];
    const pagination = result.pagination ?? {
      page: safeOptions.page,
      limit: safeOptions.limit,
      total: users.length,
      pages: Math.ceil((users.length || 1) / safeOptions.limit),
    };

    const processingTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [SUCCESS] [${requestId}] ✅ getAllUsers completed successfully`);
    console.log(`[${new Date().toISOString()}] [PERFORMANCE] [${requestId}] ⏱️ Request processing time: ${processingTime}ms`);
    console.log(`[${new Date().toISOString()}] [RESPONSE] [${requestId}] 📤 Response data:`, {
      usersCount: users.length,
      totalPages: pagination.pages,
      currentPage: pagination.page,
      totalUsers: pagination.total
    });

    return res.json({
      success: true,
      data: {
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          status: u.status
        })),
        pagination,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [ERROR] [${requestId}] ❌ getAllUsers failed after ${processingTime}ms`);
    console.log(`[${new Date().toISOString()}] [ERROR-DETAILS] [${requestId}] 🔍 Error information:`, {
      name: error.name,
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });

    return res.status(500).json({
      success: false,
      error: "Failed to load users. Please try again.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Run the test
console.log('='.repeat(80));
console.log('🧪 ENHANCED BACKEND LOGGING TEST');
console.log('='.repeat(80));
console.log('');

console.log('📋 Testing /api/users endpoint with enhanced logging...');
console.log('');

mockGetAllUsers(mockRequest, mockResponse);