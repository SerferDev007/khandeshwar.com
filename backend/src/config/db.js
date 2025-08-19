import mysql from 'mysql2/promise';
import env from './env.js';
import pino from 'pino';

const logger = pino({ name: 'database' });

// Database configuration
const dbConfig = {
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: env.DB_PORT,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
};

let pool;

// Initialize database connection pool
export const initializeDatabase = async () => {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    logger.info('✅ Connected to MySQL database');
    connection.release();
    
    // Run migrations
    await runMigrations();
    
    return pool;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Database query helper with error handling
export const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    logger.error('Database query failed:', { sql, params, error });
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

// Database migrations
const runMigrations = async () => {
  logger.info('Running database migrations...');
  
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
    ) ENGINE=InnoDB`
  ];
  
  for (const migration of migrations) {
    try {
      await query(migration);
      logger.info('Migration executed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }
  
  logger.info('✅ Database migrations completed');
};

// Graceful shutdown
export const closeDatabaseConnection = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database connection pool closed');
  }
};

export default pool;