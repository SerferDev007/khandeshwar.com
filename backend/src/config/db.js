import mysql from "mysql2/promise";
import env from "./env.js";
import pino from "pino";

const logger = pino({ name: "database" });

// Database configuration
const dbConfig = {
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: env.DB_PORT,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
};

let pool;

// Initialize database connection pool
export const initializeDatabase = async () => {
  try {
    pool = mysql.createPool(dbConfig);

    // Test connection
    const connection = await pool.getConnection();
    logger.info(">> Connected to MySQL database");
    connection.release();

    // Run migrations
    await runMigrations();

    return pool;
  } catch (error) {
    logger.error(">> Database connection failed:", error);
    throw error;
  }
};

// Database query helper with error handling
export const query = async (sql, params = []) => {
  try {
    // Count placeholders and validate parameter count
    const placeholderCount = (sql.match(/\?/g) || []).length;
    const paramCount = params.length;
    
    if (placeholderCount !== paramCount) {
      const error = new Error(`Parameter count mismatch: SQL has ${placeholderCount} placeholders but received ${paramCount} parameters`);
      error.code = 'PARAM_MISMATCH';
      logger.error("Parameter mismatch detected:", { 
        sql: sql.substring(0, 200) + '...', 
        placeholderCount,
        paramCount,
        params: params.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p)
      });
      throw error;
    }

    logger.debug("Executing query:", { 
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      paramCount: params.length
    });

    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    // Enhanced error logging for comprehensive MySQL error diagnosis
    const errorDetails = {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
      timestamp: new Date().toISOString()
    };

    const queryInfo = {
      sql: sql.substring(0, 300) + (sql.length > 300 ? '...' : ''),
      paramCount: params.length,
      placeholderCount: (sql.match(/\?/g) || []).length,
      params: params.map(p => {
        if (p === null || p === undefined) return p;
        if (typeof p === 'string' && p.length > 100) return p.substring(0, 100) + '...';
        return p;
      })
    };

    // Specific error type handling with detailed diagnostics
    if (error.code === 'ECONNREFUSED') {
      logger.error("Database connection refused:", {
        ...errorDetails,
        diagnosis: "MySQL server is not running or not accessible",
        suggestions: [
          "Check if MySQL service is running",
          "Verify database host and port configuration", 
          "Check firewall settings",
          "Ensure database server is accessible"
        ],
        queryInfo
      });
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      logger.error("Database access denied:", {
        ...errorDetails,
        diagnosis: "Invalid database credentials or insufficient permissions",
        suggestions: [
          "Check database username and password",
          "Verify user has necessary privileges",
          "Check database exists and is accessible"
        ],
        queryInfo
      });
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      logger.error("Database does not exist:", {
        ...errorDetails,
        diagnosis: "Specified database does not exist",
        suggestions: [
          "Create the database",
          "Check database name configuration",
          "Run database initialization scripts"
        ],
        queryInfo
      });
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      logger.error("Table does not exist:", {
        ...errorDetails,
        diagnosis: "Referenced table does not exist in database",
        suggestions: [
          "Run database migrations",
          "Check table name spelling",
          "Verify database schema is up to date"
        ],
        queryInfo
      });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      logger.error("Invalid column reference:", {
        ...errorDetails,
        diagnosis: "Referenced column does not exist in table",
        suggestions: [
          "Check column name spelling",
          "Verify table schema",
          "Run database migrations if needed"
        ],
        queryInfo
      });
    } else if (error.code === 'ER_PARSE_ERROR') {
      logger.error("SQL syntax error:", {
        ...errorDetails,
        diagnosis: "SQL query has syntax errors",
        suggestions: [
          "Check SQL query syntax",
          "Verify parameter placeholders",
          "Check for typos in SQL keywords"
        ],
        queryInfo
      });
    } else if (error.message && error.message.includes('mysqld_stmt_execute')) {
      logger.error("MySQL statement execution error - likely parameter mismatch:", {
        ...errorDetails,
        diagnosis: "Parameter count mismatch between placeholders and provided parameters",
        mismatchDetails: {
          placeholderCount: queryInfo.placeholderCount,
          parameterCount: queryInfo.paramCount,
          difference: queryInfo.placeholderCount - queryInfo.paramCount
        },
        suggestions: [
          "Check SQL query for correct number of ? placeholders",
          "Verify parameter array length matches placeholders",
          "Look for missing or extra parameters in query logic"
        ],
        queryInfo
      });
    } else if (error.message?.includes('Parameter count mismatch')) {
      logger.error("Parameter count mismatch detected in query helper:", {
        ...errorDetails,
        diagnosis: "Pre-execution validation caught parameter mismatch",
        mismatchDetails: {
          placeholderCount: queryInfo.placeholderCount,
          parameterCount: queryInfo.paramCount,
          difference: queryInfo.placeholderCount - queryInfo.paramCount
        },
        suggestions: [
          "Review SQL query building logic",
          "Check conditional parameter additions",
          "Verify WHERE clause construction"
        ],
        queryInfo
      });
    } else {
      // Generic database error with comprehensive logging
      logger.error("Database query failed with unknown error:", {
        ...errorDetails,
        diagnosis: "Unhandled database error occurred",
        suggestions: [
          "Check database server status",
          "Review query logic and syntax",
          "Check application logs for patterns",
          "Consider database server resources"
        ],
        queryInfo
      });
    }
    
    throw error;
  }
};

// Database connection health check
export const checkDatabaseHealth = async () => {
  console.log(`[${new Date().toISOString()}] [DB-HEALTH] 🔍 Starting database health check`);
  
  try {
    if (!pool) {
      throw new Error('Database pool is not initialized');
    }

    // Test basic connection
    console.log(`[${new Date().toISOString()}] [DB-HEALTH] 📡 Testing database connection`);
    const connection = await pool.getConnection();
    
    // Test basic query
    console.log(`[${new Date().toISOString()}] [DB-HEALTH] 🔍 Testing basic query execution`);
    const [result] = await connection.execute('SELECT 1 as test');
    console.log(`[${new Date().toISOString()}] [DB-HEALTH] ✅ Basic query successful:`, result);
    
    // Check users table exists
    console.log(`[${new Date().toISOString()}] [DB-HEALTH] 📋 Checking users table existence`);
    try {
      const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
      if (tables.length === 0) {
        console.log(`[${new Date().toISOString()}] [DB-HEALTH] ⚠️ Users table does not exist`);
      } else {
        console.log(`[${new Date().toISOString()}] [DB-HEALTH] ✅ Users table exists`);
        
        // Check table structure
        const [columns] = await connection.execute("DESCRIBE users");
        console.log(`[${new Date().toISOString()}] [DB-HEALTH] 📊 Users table columns:`, columns.map(col => ({
          field: col.Field,
          type: col.Type,
          null: col.Null,
          key: col.Key
        })));
      }
    } catch (tableError) {
      console.log(`[${new Date().toISOString()}] [DB-HEALTH] ❌ Error checking users table:`, tableError.message);
    }
    
    connection.release();
    
    console.log(`[${new Date().toISOString()}] [DB-HEALTH] ✅ Database health check completed successfully`);
    return { healthy: true, message: 'Database connection is healthy' };
    
  } catch (error) {
    console.log(`[${new Date().toISOString()}] [DB-HEALTH] ❌ Database health check failed:`, {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    return { healthy: false, message: error.message, error: error.name };
  }
};

// Transaction helper
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Function to ensure users table has all required columns
const ensureUsersTableSchema = async () => {
  try {
    logger.info(">> Checking users table schema...");
    
    // Check if email_verified column exists
    const columns = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    `);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    
    // Add missing columns
    const requiredColumns = {
      'password_hash': 'ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ""',
      'email_verified': 'ADD COLUMN email_verified BOOLEAN DEFAULT FALSE',
      'updated_at': 'ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    };
    
    for (const [columnName, alterStatement] of Object.entries(requiredColumns)) {
      if (!columnNames.includes(columnName)) {
        logger.info(`>> Adding missing column: ${columnName}`);
        try {
          await query(`ALTER TABLE users ${alterStatement}`);
          logger.info(`>> Successfully added column: ${columnName}`);
        } catch (error) {
          logger.warn(`>> Failed to add column ${columnName}:`, error.message);
        }
      }
    }
    
    logger.info(">> Users table schema validation completed");
  } catch (error) {
    logger.warn(">> Users table schema check failed (table may not exist yet):", error.message);
  }
};

// Database migrations
const runMigrations = async () => {
  logger.info("Running database migrations...");

  const migrations = [
    // Users table with authentication fields
    `CREATE TABLE IF NOT EXISTS users (
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
    ) ENGINE=InnoDB`,

    // Tenants table (created before shops due to foreign key reference)
    `CREATE TABLE IF NOT EXISTS tenants (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(100) NOT NULL,
      address TEXT NOT NULL,
      business_type VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
      id_proof VARCHAR(200) NULL,
      INDEX idx_name (name),
      INDEX idx_phone (phone),
      INDEX idx_email (email),
      INDEX idx_status (status),
      INDEX idx_business_type (business_type)
    ) ENGINE=InnoDB`,

    // Shops table
    `CREATE TABLE IF NOT EXISTS shops (
      id VARCHAR(36) PRIMARY KEY,
      shop_number VARCHAR(20) UNIQUE NOT NULL,
      size DECIMAL(10,2) NOT NULL,
      monthly_rent DECIMAL(10,2) NOT NULL,
      deposit DECIMAL(10,2) NOT NULL,
      status ENUM('Vacant', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Vacant',
      tenant_id VARCHAR(36) NULL,
      agreement_id VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      description TEXT NULL,
      INDEX idx_shop_number (shop_number),
      INDEX idx_status (status),
      INDEX idx_tenant (tenant_id),
      INDEX idx_agreement (agreement_id),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,

    // Refresh tokens table
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      is_revoked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_token_hash (token_hash),
      INDEX idx_expires_at (expires_at)
    ) ENGINE=InnoDB`,

    // Files table for S3 integration
    `CREATE TABLE IF NOT EXISTS files (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size_bytes BIGINT NOT NULL,
      s3_key VARCHAR(500) NOT NULL,
      s3_bucket VARCHAR(100) NOT NULL,
      status ENUM('uploading', 'uploaded', 'failed') DEFAULT 'uploading',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_s3_key (s3_key)
    ) ENGINE=InnoDB`,
  ];

  const migrationNames = ["users", "tenants", "shops", "refresh_tokens", "files"];

  for (let i = 0; i < migrations.length; i++) {
    try {
      await query(migrations[i]);
      logger.info(`>> Migration ${migrationNames[i]} executed successfully`);
    } catch (error) {
      logger.error("Migration failed:", error);
      throw error;
    }
  }

  // Post-migration: Ensure users table has all required columns
  await ensureUsersTableSchema();

  logger.info(">> Database migrations completed");
};

// Graceful shutdown
export const closeDatabaseConnection = async () => {
  if (pool) {
    await pool.end();
    logger.info("Database connection pool closed");
  }
};

export default pool;
