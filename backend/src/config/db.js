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
    // Enhanced error logging for MySQL parameter errors
    if (error.message && error.message.includes('mysqld_stmt_execute')) {
      logger.error("MySQL statement execution error - possible parameter mismatch:", { 
        sql: sql.substring(0, 200) + '...',
        paramCount: params.length,
        placeholderCount: (sql.match(/\?/g) || []).length,
        error: error.message,
        params: params.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p)
      });
    } else {
      logger.error("Database query failed:", { 
        sql: sql.substring(0, 200) + '...',
        paramCount: params.length,
        error: error.message 
      });
    }
    throw error;
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
