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

  // Get all users with pagination
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "created_at",
      order = "desc",
      role,
      status,
    } = options;
    const offset = (page - 1) * limit;

    // Declare variables outside try block for error logging
    let whereClause = "";
    let params = [];

    try {
      // Build WHERE clause with proper parameters
      if (role) {
        whereClause += " WHERE role = ?";
        params.push(role);
      }

      if (status) {
        whereClause += whereClause ? " AND status = ?" : " WHERE status = ?";
        params.push(status);
      }

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

      // Enhanced logging before query execution
      logger.info("User.findAll executing with parameters:", {
        options: {
          page,
          limit,
          sort,
          order,
          role,
          status
        },
        computed: {
          whereClause,
          paramCount: params.length,
          sortColumn,
          sortOrder,
          offset
        },
        params: params.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p)
      });

      // Get total count with detailed logging
      const countQuery = `SELECT COUNT(*) as count FROM users${whereClause}`;
      logger.debug("Executing count query:", {
        sql: countQuery,
        params: params,
        parameterCount: params.length,
        placeholderCount: (countQuery.match(/\?/g) || []).length
      });

      const totalResults = await query(countQuery, params);
      const total = totalResults[0].count;

      logger.info("Count query successful:", {
        totalCount: total,
        query: countQuery.substring(0, 100) + (countQuery.length > 100 ? '...' : '')
      });

      // Get paginated results - use safe column name and order
      const selectQuery = `SELECT id, username, email, role, status, email_verified, last_login, created_at, updated_at
   FROM users${whereClause}
   ORDER BY ${sortColumn} ${sortOrder}
   LIMIT ? OFFSET ?`;
      
      const selectParams = [...params, limit, offset];
      
      logger.debug("Executing select query:", {
        sql: selectQuery.replace(/\s+/g, ' ').trim(),
        params: selectParams,
        parameterCount: selectParams.length,
        placeholderCount: (selectQuery.match(/\?/g) || []).length
      });

      const users = await query(selectQuery, selectParams);

      logger.info("User.findAll query completed successfully:", {
        totalCount: total,
        returnedCount: users.length,
        page,
        limit,
        hasUsers: users.length > 0
      });

      return {
        users: users.map((user) => new User(user)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      // Enhanced error logging with comprehensive details
      logger.error("User.findAll failed with detailed error information:", {
        errorDetails: {
          message: error.message,
          code: error.code,
          errno: error.errno,
          sqlState: error.sqlState,
          sqlMessage: error.sqlMessage,
          sql: error.sql
        },
        requestContext: {
          options,
          page,
          limit,
          sort,
          order,
          role,
          status,
          offset
        },
        queryContext: {
          whereClause: whereClause || '(no WHERE clause)',
          paramCount: params?.length || 0,
          params: params?.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p) || []
        },
        stackTrace: error.stack,
        timestamp: new Date().toISOString()
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
