#!/usr/bin/env node
/**
 * Database Connection Verification Utility
 * Tests database connectivity and verifies table structure for debugging
 */

import mysql from "mysql2/promise";
import env from "./src/config/env.js";
import pino from "pino";

const logger = pino({ name: "DBConnectionTest" });

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

/**
 * Test database connection and log detailed information
 */
async function testDatabaseConnection() {
  console.log("🔌 Testing database connection...\n");
  
  let pool;
  try {
    // Create connection pool
    pool = mysql.createPool(dbConfig);
    
    // Test basic connection
    const connection = await pool.getConnection();
    console.log("✅ Database connection successful");
    console.log(`   📍 Host: ${env.DB_HOST}:${env.DB_PORT}`);
    console.log(`   🏪 Database: ${env.DB_NAME}`);
    console.log(`   👤 User: ${env.DB_USER}`);
    connection.release();
    
    return pool;
  } catch (error) {
    console.log("❌ Database connection failed:");
    console.log(`   🔍 Error: ${error.message}`);
    console.log(`   📍 Attempting to connect to: ${env.DB_HOST}:${env.DB_PORT}`);
    console.log(`   🏪 Database: ${env.DB_NAME}`);
    console.log(`   👤 User: ${env.DB_USER}`);
    
    // Check if it's a specific MySQL error
    if (error.code === 'ECONNREFUSED') {
      console.log("\n💡 Troubleshooting suggestions:");
      console.log("   • Ensure MySQL server is running");
      console.log("   • Check if the port 3306 is accessible");
      console.log("   • Verify firewall settings");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("\n💡 Troubleshooting suggestions:");
      console.log("   • Check database username and password");
      console.log("   • Verify user has access to the database");
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log("\n💡 Troubleshooting suggestions:");
      console.log("   • Check if the database exists");
      console.log("   • Create the database if it doesn't exist");
    }
    
    throw error;
  }
}

/**
 * Verify users table structure and log detailed schema information
 */
async function verifyUsersTableStructure(pool) {
  console.log("\n📋 Verifying users table structure...\n");
  
  try {
    // Check if users table exists
    const [tables] = await pool.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [env.DB_NAME]
    );
    
    if (tables.length === 0) {
      console.log("❌ Users table does not exist");
      console.log("\n💡 You may need to run database migrations:");
      console.log("   • Check if migrations are set up in your application");
      console.log("   • Look for schema.sql or migration files");
      return false;
    }
    
    console.log("✅ Users table exists");
    
    // Get table schema
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' ORDER BY ORDINAL_POSITION",
      [env.DB_NAME]
    );
    
    console.log("\n📊 Users table schema:");
    columns.forEach(col => {
      console.log(`   • ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.EXTRA || ''}`);
      if (col.COLUMN_DEFAULT !== null) {
        console.log(`     Default: ${col.COLUMN_DEFAULT}`);
      }
    });
    
    // Check for required columns
    const columnNames = columns.map(col => col.COLUMN_NAME);
    const requiredColumns = [
      'id', 'username', 'email', 'password_hash', 'role', 
      'status', 'email_verified', 'created_at', 'updated_at'
    ];
    
    console.log("\n🔍 Required columns check:");
    const missingColumns = [];
    requiredColumns.forEach(reqCol => {
      if (columnNames.includes(reqCol)) {
        console.log(`   ✅ ${reqCol}`);
      } else {
        console.log(`   ❌ ${reqCol} (MISSING)`);
        missingColumns.push(reqCol);
      }
    });
    
    if (missingColumns.length > 0) {
      console.log(`\n⚠️  Missing columns detected: ${missingColumns.join(', ')}`);
      console.log("💡 The table may need to be updated or migrations need to be run");
      return false;
    }
    
    // Count existing users
    const [countResult] = await pool.execute("SELECT COUNT(*) as count FROM users");
    const userCount = countResult[0].count;
    console.log(`\n👥 Current user count: ${userCount}`);
    
    if (userCount > 0) {
      // Show sample user data (without sensitive info)
      const [sampleUsers] = await pool.execute(
        "SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 3"
      );
      
      console.log("\n📋 Sample users (recent 3):");
      sampleUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.role}) - ${user.status} - ${user.email}`);
      });
    } else {
      console.log("   ℹ️  No users found in table");
    }
    
    return true;
  } catch (error) {
    console.log("❌ Failed to verify users table structure:");
    console.log(`   🔍 Error: ${error.message}`);
    console.log(`   📄 SQL State: ${error.sqlState || 'N/A'}`);
    console.log(`   🔢 Error Code: ${error.code || 'N/A'}`);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log("\n💡 The users table doesn't exist. You may need to:");
      console.log("   • Run database migrations");
      console.log("   • Create the table manually");
      console.log("   • Check your application setup");
    }
    
    throw error;
  }
}

/**
 * Test a basic User.findAll equivalent query to identify issues
 */
async function testUserFindAllQuery(pool) {
  console.log("\n🧪 Testing User.findAll equivalent query...\n");
  
  try {
    // Test basic query without parameters
    console.log("📋 Test 1: Basic SELECT query");
    const [basicResult] = await pool.execute("SELECT COUNT(*) as count FROM users");
    console.log(`   ✅ Success - Query executed, found ${basicResult[0].count} users`);
    
    // Test paginated query (similar to User.findAll)
    console.log("\n📋 Test 2: Paginated SELECT query");
    const [paginatedResult] = await pool.execute(
      `SELECT id, username, email, role, status, email_verified, last_login, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [10, 0]
    );
    console.log(`   ✅ Success - Paginated query executed, returned ${paginatedResult.length} users`);
    
    // Test with WHERE clause (role filter)
    console.log("\n📋 Test 3: Query with WHERE clause (role filter)");
    const [filteredResult] = await pool.execute(
      `SELECT COUNT(*) as count FROM users WHERE role = ?`,
      ['Admin']
    );
    console.log(`   ✅ Success - Filtered query executed, found ${filteredResult[0].count} admin users`);
    
    // Test complex query (similar to User.findAll with all parameters)
    console.log("\n📋 Test 4: Complex query (User.findAll simulation)");
    const [complexResult] = await pool.execute(
      `SELECT id, username, email, role, status, email_verified, last_login, created_at, updated_at
       FROM users
       WHERE role = ? AND status = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      ['Admin', 'Active', 5, 0]
    );
    console.log(`   ✅ Success - Complex query executed, returned ${complexResult.length} users`);
    
    console.log("\n🎉 All User.findAll equivalent queries executed successfully!");
    return true;
    
  } catch (error) {
    console.log("❌ User.findAll query test failed:");
    console.log(`   🔍 Error: ${error.message}`);
    console.log(`   📄 SQL State: ${error.sqlState || 'N/A'}`);
    console.log(`   🔢 Error Code: ${error.code || 'N/A'}`);
    console.log(`   📚 Stack trace: ${error.stack}`);
    
    // Provide specific troubleshooting based on error type
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log("\n💡 Column doesn't exist - check table schema");
    } else if (error.code === 'ER_PARSE_ERROR') {
      console.log("\n💡 SQL syntax error - check query structure");
    } else if (error.message.includes('Parameter count mismatch')) {
      console.log("\n💡 Parameter mismatch - SQL placeholders don't match parameter count");
    }
    
    throw error;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log("🔍 Database Connection and Users Table Verification\n");
  console.log("=" .repeat(60));
  
  let pool;
  try {
    // Test 1: Database Connection
    pool = await testDatabaseConnection();
    
    // Test 2: Users Table Structure
    const tableValid = await verifyUsersTableStructure(pool);
    
    if (tableValid) {
      // Test 3: User.findAll Query Simulation
      await testUserFindAllQuery(pool);
      
      console.log("\n" + "=" .repeat(60));
      console.log("🎉 All database verification tests completed successfully!");
      console.log("✅ Database connection is working");
      console.log("✅ Users table structure is valid");
      console.log("✅ User.findAll queries should work properly");
      console.log("\nIf you're still experiencing 500 errors, the issue may be:");
      console.log("   • Application-level error handling");
      console.log("   • Authentication/middleware issues");
      console.log("   • Network connectivity from frontend");
    } else {
      console.log("\n" + "=" .repeat(60));
      console.log("⚠️  Database verification completed with issues");
      console.log("❌ Users table structure needs attention");
      console.log("\n💡 Recommended actions:");
      console.log("   • Run database migrations");
      console.log("   • Update table schema");
      console.log("   • Check application setup documentation");
    }
    
  } catch (error) {
    console.log("\n" + "=" .repeat(60));
    console.log("💥 Database verification failed");
    console.log(`🔍 Final error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log("\n🚨 Cannot connect to MySQL database!");
      console.log("Please ensure MySQL is installed and running:");
      console.log("   • Ubuntu/Debian: sudo systemctl start mysql");
      console.log("   • macOS: brew services start mysql");
      console.log("   • Windows: Start MySQL service");
      console.log("   • Docker: docker run --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -d mysql:8.0");
    }
  } finally {
    if (pool) {
      await pool.end();
      console.log("\n🔌 Database connection pool closed");
    }
  }
}

// Run the verification
main().catch(console.error);