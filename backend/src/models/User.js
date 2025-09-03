import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/db.js";
import pino from "pino";

const logger = pino({ name: "UserModel" });

export class User {
  constructor(data = {}) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.password_hash || data.passwordHash;
    this.role = data.role || "Viewer";
    this.status = data.status || "Active";
    this.emailVerified = data.email_verified || data.emailVerified || false;
    this.lastLogin = data.last_login || data.lastLogin;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Create a new user
  static async create(userData) {
    const { username, email, password, role = "Viewer" } = userData;

    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const id = uuidv4();

      await query(
        `INSERT INTO users (id, username, email, password_hash, role, status, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, username, email, passwordHash, role, "Active", false]
      );

      logger.info("User created:", { id, username, email, role });

      return await User.findById(id);
    } catch (error) {
      logger.error("Failed to create user:", error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const users = await query("SELECT * FROM users WHERE id = ?", [id]);
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      logger.error("Failed to find user by ID:", error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const users = await query("SELECT * FROM users WHERE email = ?", [email]);
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      logger.error("Failed to find user by email:", error);
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const users = await query("SELECT * FROM users WHERE username = ?", [
        username,
      ]);
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      logger.error("Failed to find user by username:", error);
      throw error;
    }
  }

  /**
   * Get all users with pagination and robust parameter validation
   * 
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Items per page (1-100)
   * @param {string} options.sort - Sort column
   * @param {string} options.order - Sort order (asc/desc)
   * @param {string} options.role - Role filter
   * @param {string} options.status - Status filter
   * @param {string} requestId - Request tracking ID
   * @returns {Object} Result with users and pagination info
   * 
   * Note: This method includes a fallback mechanism for ER_WRONG_ARGUMENTS errors.
   * If parameterized queries fail due to parameter binding issues, it retries
   * with inlined LIMIT/OFFSET values to ensure reliability.
   */
  static async findAll(options = {}, requestId = null) {
    const reqId = requestId || 'no-req-id';
    console.log(`[${new Date().toISOString()}] [DB-MODEL] [${reqId}] 🔍 User.findAll called with options:`, options);
    
    const {
      page: rawPage = 1,
      limit: rawLimit = 10,
      sort = "created_at",
      order = "desc",
      role,
      status,
    } = options;

    // ✅ Robust parameter sanitization with detailed logging
    let safeLimit = parseInt(rawLimit, 10);
    if (isNaN(safeLimit) || safeLimit < 1 || safeLimit > 100) {
      console.log(`[${new Date().toISOString()}] [DB-PARAM-CHECK] [${reqId}] ⚠️ Invalid limit, using fallback:`, {
        raw: rawLimit,
        parsed: safeLimit,
        fallback: 10
      });
      safeLimit = 10;
    }

    let safePage = parseInt(rawPage, 10);
    if (isNaN(safePage) || safePage < 1) {
      console.log(`[${new Date().toISOString()}] [DB-PARAM-CHECK] [${reqId}] ⚠️ Invalid page, using fallback:`, {
        raw: rawPage,
        parsed: safePage,
        fallback: 1
      });
      safePage = 1;
    }

    const safeOffset = (safePage - 1) * safeLimit;

    // Log parameter validation details
    console.log(`[${new Date().toISOString()}] [DB-PARAM-CHECK] [${reqId}] 🔢 Parameter validation complete:`, {
      limit: { value: safeLimit, type: typeof safeLimit, isInteger: Number.isInteger(safeLimit) },
      page: { value: safePage, type: typeof safePage, isInteger: Number.isInteger(safePage) },
      offset: { value: safeOffset, type: typeof safeOffset, isInteger: Number.isInteger(safeOffset) },
      sort: { value: sort, type: typeof sort },
      order: { value: order, type: typeof order }
    });

    console.log(`[${new Date().toISOString()}] [DB-PARAMS] [${reqId}] 📊 Final parameters for query:`, {
      page: safePage,
      limit: safeLimit,
      offset: safeOffset,
      sort,
      order,
      role,
      status
    });

    try {
      let whereClause = "";
      const params = [];

      console.log(`[${new Date().toISOString()}] [DB-WHERE] [${reqId}] 🔧 Building WHERE clause`);


      // Build WHERE clause with proper parameters
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

      // Validate sort column to prevent SQL injection
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

      logger.info("User.findAll query params:", {
        whereClause,
        params: params.length,
        sortColumn,
        sortOrder,
        limit: safeLimit,
        offset: safeOffset,
      });

      console.log(`[${new Date().toISOString()}] [DB-QUERY-PREP] [${reqId}] 📊 Query preparation complete:`, {
        whereClause,
        paramCount: params.length,
        sortColumn,
        sortOrder,
        limit: safeLimit,
        offset: safeOffset
      });

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM users${whereClause}`;
      console.log(`[${new Date().toISOString()}] [DB-QUERY] [${reqId}] 📤 Executing count query:`, {
        sql: countQuery,
        params: params
      });
      
      const queryStartTime = Date.now();
      const totalResults = await query(countQuery, params);
      const countQueryTime = Date.now() - queryStartTime;

      const total = totalResults[0].count;
      
      console.log(`[${new Date().toISOString()}] [DB-RESULT] [${reqId}] 📥 Count query result:`, {
        total,
        queryTime: `${countQueryTime}ms`
      });

      logger.info("Count query successful:", {
        totalCount: total,
        query: countQuery.substring(0, 100) + (countQuery.length > 100 ? '...' : '')
      });

      // Get paginated results with retry mechanism for ER_WRONG_ARGUMENTS
      const dataQuery = `SELECT id, username, email, role, status, email_verified, last_login, created_at, updated_at
   FROM users${whereClause}
   ORDER BY ${sortColumn} ${sortOrder}
   LIMIT ? OFFSET ?`;
   
      const dataParams = [...params, safeLimit, safeOffset];
      
      // Log detailed parameter information before query execution
      console.log(`[${new Date().toISOString()}] [DB-PARAM-CHECK] [${reqId}] 🔍 Pre-query parameter diagnostic:`, {
        totalParams: dataParams.length,
        parameterDetails: dataParams.map((param, index) => ({
          index,
          value: param,
          type: typeof param,
          isNaN: typeof param === 'number' ? isNaN(param) : 'N/A',
          isInteger: typeof param === 'number' ? Number.isInteger(param) : 'N/A'
        }))
      });
      
      console.log(`[${new Date().toISOString()}] [DB-QUERY] [${reqId}] 📤 Executing data query (attempt 1):`, {
        sql: dataQuery,
        params: dataParams
      });
      
      let users;
      let dataQueryTime;
      const dataQueryStartTime = Date.now();
      
      try {
        // First attempt with parameterized query
        users = await query(dataQuery, dataParams);
        dataQueryTime = Date.now() - dataQueryStartTime;
        
        console.log(`[${new Date().toISOString()}] [DB-RESULT] [${reqId}] 📥 Data query result (parameterized):`, {
          rowCount: users.length,
          queryTime: `${dataQueryTime}ms`
        });
      } catch (error) {
        dataQueryTime = Date.now() - dataQueryStartTime;
        
        if (error.code === 'ER_WRONG_ARGUMENTS') {
          console.log(`[${new Date().toISOString()}] [DB-RETRY] [${reqId}] ⚠️ ER_WRONG_ARGUMENTS detected, attempting fallback with inlined LIMIT/OFFSET`);
          logger.warn("ER_WRONG_ARGUMENTS detected, retrying with inlined values", {
            originalParams: dataParams,
            requestId: reqId
          });
          
          // Retry with inlined LIMIT/OFFSET (no parameter binding for LIMIT/OFFSET)
          const fallbackQuery = `SELECT id, username, email, role, status, email_verified, last_login, created_at, updated_at
   FROM users${whereClause}
   ORDER BY ${sortColumn} ${sortOrder}
   LIMIT ${safeLimit} OFFSET ${safeOffset}`;
          
          console.log(`[${new Date().toISOString()}] [DB-RETRY] [${reqId}] 🔄 Executing fallback query (attempt 2):`, {
            sql: fallbackQuery,
            params: params, // Only WHERE clause parameters
            inlinedLimit: safeLimit,
            inlinedOffset: safeOffset
          });
          
          const fallbackStartTime = Date.now();
          users = await query(fallbackQuery, params); // Only WHERE clause params
          const fallbackQueryTime = Date.now() - fallbackStartTime;
          dataQueryTime += fallbackQueryTime; // Add both attempt times
          
          console.log(`[${new Date().toISOString()}] [DB-RETRY] [${reqId}] ✅ Fallback query successful:`, {
            rowCount: users.length,
            fallbackQueryTime: `${fallbackQueryTime}ms`,
            totalQueryTime: `${dataQueryTime}ms`
          });
          
          logger.info("Fallback query successful after ER_WRONG_ARGUMENTS", {
            rowCount: users.length,
            totalTime: dataQueryTime,
            requestId: reqId
          });
        } else {
          // Re-throw non-ER_WRONG_ARGUMENTS errors
          throw error;
        }
      }

      const result = {
        users: users.map((user) => new User(user)),
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          pages: Math.ceil(total / safeLimit),
        },
      };

      console.log(`[${new Date().toISOString()}] [DB-SUCCESS] [${reqId}] ✅ User.findAll completed successfully:`, {
        totalCount: total,
        returnedCount: users.length,
        page: safePage,
        limit: safeLimit,
        totalPages: result.pagination.pages,
        totalQueryTime: `${countQueryTime + dataQueryTime}ms`
      });

      logger.info("User.findAll results:", {
        totalCount: total,
        returnedCount: users.length,
        page: safePage,
        limit: safeLimit,
        requestId: reqId
      });

      return result;
    } catch (error) {

      console.log(`[${new Date().toISOString()}] [DB-ERROR] [${reqId}] ❌ User.findAll failed:`, {
        name: error.name,
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });

      logger.error("Failed to find users:", {
        error: error.message,
        stack: error.stack,
        options,
        requestId: reqId

      });

      // Provide specific error guidance based on error type
      if (error.code === 'ER_NO_SUCH_TABLE') {
        logger.error("🚨 Database table 'users' does not exist. Run database migrations.");
      } else if (error.code === 'ER_BAD_FIELD_ERROR') {
        logger.error("🚨 Invalid column name in query. Check table schema.");
      } else if (error.code === 'ER_PARSE_ERROR') {
        logger.error("🚨 SQL syntax error in User.findAll query.");
      } else if (error.code === 'ECONNREFUSED') {
        logger.error("🚨 Cannot connect to database. Check database connection.");
      } else if (error.message?.includes('Parameter count mismatch')) {
        logger.error("🚨 SQL parameter mismatch detected. Check query placeholders.");
      } else if (error.code === 'ER_WRONG_ARGUMENTS') {
        logger.error("🚨 ER_WRONG_ARGUMENTS - Incorrect arguments to mysqld_stmt_execute. Parameter binding issue detected.");
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        logger.error("🚨 Database access denied. Check user credentials.");
      }

      throw error;
    }
  }

  // Update user
  async update(updateData) {
    try {
      const allowedFields = [
        "username",
        "email",
        "role",
        "status",
        "email_verified",
      ];
      const updates = [];
      const params = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error("No valid fields to update");
      }

      params.push(this.id);

      await query(
        `UPDATE users SET ${updates.join(
          ", "
        )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );

      logger.info("User updated:", { id: this.id, updates: updateData });

      // Refresh user data
      const updatedUser = await User.findById(this.id);
      Object.assign(this, updatedUser);

      return this;
    } catch (error) {
      logger.error("Failed to update user:", error);
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await query(
        "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [passwordHash, this.id]
      );

      logger.info("User password updated:", { id: this.id });
      this.passwordHash = passwordHash;
    } catch (error) {
      logger.error("Failed to update password:", error);
      throw error;
    }
  }

  // Update last login
  async updateLastLogin() {
    try {
      await query(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
        [this.id]
      );

      logger.info("User last login updated:", { id: this.id });
      this.lastLogin = new Date();
    } catch (error) {
      logger.error("Failed to update last login:", error);
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.passwordHash);
    } catch (error) {
      logger.error("Failed to verify password:", error);
      throw error;
    }
  }

  // Delete user (soft delete by setting status to Inactive)
  async delete() {
    try {
      await query(
        "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        ["Inactive", this.id]
      );

      logger.info("User deleted (soft):", { id: this.id });
      this.status = "Inactive";
    } catch (error) {
      logger.error("Failed to delete user:", error);
      throw error;
    }
  }

  // Convert to safe object (without password)
  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      status: this.status,
      emailVerified: this.emailVerified,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Convert to database object
  toDbObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      password_hash: this.passwordHash,
      role: this.role,
      status: this.status,
      email_verified: this.emailVerified,
      last_login: this.lastLogin,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  // Create from database row
  static fromDbRow(row) {
    return new User(row);
  }

  // Legacy method for backward compatibility
  static getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'Treasurer', 'Viewer') NOT NULL DEFAULT 'Viewer',
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        email_verified BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_status (status)
      ) ENGINE=InnoDB;
    `;
  }
}
