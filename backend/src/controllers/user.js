import { User } from "../models/User.js";
import { asyncHandler } from "../middleware/error.js";
import pino from "pino";
import { v4 as uuidv4 } from "uuid";

const logger = pino({ name: "UserController" });

// Get all users (Admin/Treasurer)
export const getAllUsers = asyncHandler(async (req, res) => {
  // Generate unique request ID for tracking
  const requestId = uuidv4().substring(0, 8);
  const startTime = Date.now();
  
  console.log(`[${new Date().toISOString()}] [USER-API] [${requestId}] 🔍 Starting getAllUsers request`);
  console.log(`[${new Date().toISOString()}] [REQUEST] [${requestId}] 📋 Request details:`, {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
    userRole: req.user?.role
  });

  try {
    // ✅ Don’t assume validator ran; fall back to query and sane defaults
    const v = req.validatedData ?? {};
    const q = req.query ?? {};

    const rawPage = v.page ?? q.page ?? 1;
    const rawLimit = v.limit ?? q.limit ?? 10;
    const rawSort = v.sort ?? q.sort ?? "created_at";
    const rawOrder = v.order ?? q.order ?? "desc";
    const rawRole = v.role ?? q.role;
    const rawStatus = v.status ?? q.status;

    console.log(`[${new Date().toISOString()}] [PARAMS] [${requestId}] 📥 Raw parameters:`, {
      page: rawPage,
      limit: rawLimit,
      sort: rawSort,
      order: rawOrder,
      role: rawRole,
      status: rawStatus
    });

    logger.info("getAllUsers request (raw):", {
      page: rawPage,
      limit: rawLimit,
      sort: rawSort,
      order: rawOrder,
      role: rawRole,
      status: rawStatus,
      user: req.user?.id,
    });

    // ✅ Enhanced parameter sanitization with explicit validation
    // Parse and validate page parameter
    let safePage = parseInt(rawPage, 10);
    if (isNaN(safePage) || safePage < 1) {
      console.log(`[${new Date().toISOString()}] [PARAM-SANITIZE] [${requestId}] ⚠️ Invalid page parameter:`, {
        raw: rawPage,
        parsed: safePage,
        fallback: 1
      });
      safePage = 1;
    }

    // Parse and validate limit parameter with bounds checking
    let safeLimit = parseInt(rawLimit, 10);
    if (isNaN(safeLimit) || safeLimit < 1 || safeLimit > 100) {
      console.log(`[${new Date().toISOString()}] [PARAM-SANITIZE] [${requestId}] ⚠️ Invalid limit parameter:`, {
        raw: rawLimit,
        parsed: safeLimit,
        fallback: 10,
        reason: isNaN(safeLimit) ? 'NaN' : (safeLimit < 1 ? 'below minimum' : 'above maximum')
      });
      safeLimit = 10; // Use default instead of Math.min/Math.max with potentially invalid values
    }

    const safeOptions = {
      page: safePage,
      limit: safeLimit,
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
    console.log(`[${new Date().toISOString()}] [PARAM-VALIDATION] [${requestId}] 🔢 Parameter validation details:`, {
      page: { value: safeOptions.page, type: typeof safeOptions.page, isInteger: Number.isInteger(safeOptions.page) },
      limit: { value: safeOptions.limit, type: typeof safeOptions.limit, isInteger: Number.isInteger(safeOptions.limit) },
      calculatedOffset: (safeOptions.page - 1) * safeOptions.limit
    });
    logger.info("getAllUsers sanitized options:", safeOptions);

    console.log(`[${new Date().toISOString()}] [MODEL-CALL] [${requestId}] 📤 Calling User.findAll with options:`, safeOptions);
    // ✅ Call model safely
    const result = await User.findAll(safeOptions, requestId);

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
      logger.error("User.findAll returned unexpected value", {
        resultType: typeof result,
        requestId
      });
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

    logger.info("getAllUsers success:", {
      usersCount: users.length,
      totalPages: pagination.pages,
      currentPage: pagination.page,
      processingTime,
      requestId
    });

    return res.json({
      success: true,
      data: {
        users: users.map((u) =>
          typeof u?.toSafeObject === "function" ? u.toSafeObject() : u
        ),
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
      stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
    });

    logger.error("getAllUsers failed:", {
      error: error.message,
      stack: error.stack,
      params: req.validatedData,
      requestId,
      processingTime

    });

    // Determine appropriate status code and error message based on error type
    let statusCode = 500;
    let errorMessage = "Failed to load users. Please try again.";
    let errorCode = "INTERNAL_ERROR";

    if (error.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = "Database service unavailable. Please try again later.";
      errorCode = "DATABASE_CONNECTION_ERROR";
      logger.error("🚨 Database connection refused - service may be down");
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      statusCode = 503;
      errorMessage = "User data service temporarily unavailable.";
      errorCode = "DATABASE_SCHEMA_ERROR";
      logger.error("🚨 Users table missing - database migration required");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      statusCode = 503;
      errorMessage = "Database service configuration error.";
      errorCode = "DATABASE_ACCESS_ERROR";
      logger.error("🚨 Database access denied - check credentials");
    } else if (error.message?.includes('Parameter count mismatch')) {
      statusCode = 500;
      errorMessage = "Query parameter error detected.";
      errorCode = "QUERY_PARAMETER_ERROR";
      logger.error("🚨 SQL parameter mismatch in User.findAll");
    } else if (error.code === 'ER_WRONG_ARGUMENTS') {
      statusCode = 500;
      errorMessage = "Database query parameter error. Please try again.";
      errorCode = "DATABASE_PARAMETER_ERROR";
      logger.error("🚨 ER_WRONG_ARGUMENTS - Database parameter mismatch detected");
      console.log(`[${new Date().toISOString()}] [ERROR-SPECIFIC] [${requestId}] 🚨 ER_WRONG_ARGUMENTS detected - this indicates parameter binding issues`);
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      errorCode,
      details: process.env.NODE_ENV === "development" ? {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState
      } : undefined,
    });
  }
});

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.validatedData;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }
  res.json({ success: true, data: { user: user.toSafeObject() } });
});

// Create user (Admin only)
export const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.validatedData;

  const existingUserByEmail = await User.findByEmail(email);
  if (existingUserByEmail) {
    return res
      .status(409)
      .json({ success: false, error: "Email already registered" });
  }
  const existingUserByUsername = await User.findByUsername(username);
  if (existingUserByUsername) {
    return res
      .status(409)
      .json({ success: false, error: "Username already taken" });
  }

  const user = await User.create({
    username,
    email,
    password,
    role: role || "Viewer",
  });

  logger.info("User created by admin:", {
    createdUserId: user.id,
    createdBy: req.user.id,
    username: user.username,
    role: user.role,
  });

  res.status(201).json({ success: true, data: { user: user.toSafeObject() } });
});

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  const { id, username, email, role, status } = req.validatedData;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  if (req.user.role !== "Admin" && req.user.id !== id) {
    return res
      .status(403)
      .json({ success: false, error: "You can only update your own profile" });
  }

  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;

  if (req.user.role === "Admin") {
    if (role) updateData.role = role;
    if (status) updateData.status = status;
  }

  if (username && username !== user.username) {
    const existingUser = await User.findByUsername(username);
    if (existingUser && existingUser.id !== user.id) {
      return res
        .status(409)
        .json({ success: false, error: "Username already taken" });
    }
  }
  if (email && email !== user.email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== user.id) {
      return res
        .status(409)
        .json({ success: false, error: "Email already registered" });
    }
  }

  await user.update(updateData);

  logger.info("User updated:", {
    updatedUserId: user.id,
    updatedBy: req.user.id,
    updates: updateData,
  });

  res.json({ success: true, data: { user: user.toSafeObject() } });
});

// Delete user (Admin only) - soft delete
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.validatedData;

  if (req.user.id === id) {
    return res
      .status(400)
      .json({ success: false, error: "You cannot delete your own account" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  await user.delete();

  logger.info("User deleted (soft):", {
    deletedUserId: user.id,
    deletedBy: req.user.id,
    username: user.username,
  });

  res.json({ success: true, data: { message: "User deleted successfully" } });
});

// Get user statistics (Admin only)
export const getUserStats = asyncHandler(async (req, res) => {
  const totalResult = await User.findAll({ limit: 1 });
  const activeResult = await User.findAll({ status: "Active", limit: 1 });
  const adminResult = await User.findAll({ role: "Admin", limit: 1 });
  const treasurerResult = await User.findAll({ role: "Treasurer", limit: 1 });
  const viewerResult = await User.findAll({ role: "Viewer", limit: 1 });

  res.json({
    success: true,
    data: {
      stats: {
        total: totalResult.pagination.total,
        active: activeResult.pagination.total,
        inactive: totalResult.pagination.total - activeResult.pagination.total,
        byRole: {
          Admin: adminResult.pagination.total,
          Treasurer: treasurerResult.pagination.total,
          Viewer: viewerResult.pagination.total,
        },
      },
    },
  });
});
