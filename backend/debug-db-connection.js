#!/usr/bin/env node

import { initializeDatabase, checkDatabaseHealth, query, closeDatabaseConnection } from './src/config/db.js';
import { User } from './src/models/User.js';
import pino from 'pino';

const logger = pino({ name: 'database-diagnostics' });

console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 🚀 Starting database diagnostic utility`);

async function runDiagnostics() {
  try {
    // Initialize database connection
    console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 📡 Initializing database connection`);
    await initializeDatabase();
    
    // Run health check
    console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 🔍 Running database health check`);
    const healthCheck = await checkDatabaseHealth();
    
    if (!healthCheck.healthy) {
      console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] ❌ Database is not healthy:`, healthCheck.message);
      process.exit(1);
    }
    
    // Test User.findAll with various parameters
    console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 🧪 Testing User.findAll with different parameters`);
    
    const testCases = [
      { name: 'Basic query', options: {} },
      { name: 'With pagination', options: { page: 1, limit: 5 } },
      { name: 'With role filter', options: { role: 'Admin' } },
      { name: 'With status filter', options: { status: 'Active' } },
      { name: 'With sorting', options: { sort: 'username', order: 'asc' } },
      { name: 'Combined filters', options: { page: 1, limit: 10, role: 'Admin', status: 'Active', sort: 'created_at', order: 'desc' } }
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 🧪 Testing: ${testCase.name}`);
        const result = await User.findAll(testCase.options, 'diagnostics-test');
        console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] ✅ ${testCase.name} successful:`, {
          usersFound: result.users.length,
          totalCount: result.pagination.total,
          pages: result.pagination.pages
        });
      } catch (error) {
        console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] ❌ ${testCase.name} failed:`, {
          name: error.name,
          message: error.message,
          code: error.code
        });
      }
    }
    
    // Test database table structure
    console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 📊 Testing database table structure`);
    try {
      const users = await query('SELECT COUNT(*) as count FROM users');
      console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 📈 Users table count:`, users[0].count);
      
      // Test sample user data
      const sampleUsers = await query('SELECT id, username, email, role, status FROM users LIMIT 3');
      console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 👥 Sample users:`, sampleUsers);
      
    } catch (error) {
      console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] ❌ Error testing table structure:`, error.message);
    }
    
    console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] ✅ All diagnostics completed successfully`);
    
  } catch (error) {
    console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] ❌ Diagnostic utility failed:`, {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    logger.error('Database diagnostics failed:', error);
    process.exit(1);
  } finally {
    // Clean up database connection
    await closeDatabaseConnection();
    console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 🔚 Database diagnostics completed`);
  }
}

// Handle process events
process.on('SIGINT', async () => {
  console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 🛑 Received SIGINT, shutting down gracefully`);
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(`[${new Date().toISOString()}] [DIAGNOSTICS] 🛑 Received SIGTERM, shutting down gracefully`);
  await closeDatabaseConnection();
  process.exit(0);
});

// Run diagnostics
runDiagnostics().catch((error) => {
  console.error('Unhandled error in diagnostics:', error);
  process.exit(1);
});