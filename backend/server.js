import app from './app.js';
import { closeDatabaseConnection } from './src/config/db.js';
import { RefreshToken } from './src/models/RefreshToken.js';
import env from './src/config/env.js';
import pino from 'pino';
import pinoPretty from 'pino-pretty';

// Create logger
const logger = pino(
  env.NODE_ENV === 'development'
    ? pinoPretty({
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
        colorize: true,
      })
    : {}
);

let server;

const startServer = async () => {
  try {
    // Start server
    server = app.listen(env.PORT, () => {
      logger.info(`🚀 Khandeshwar Management API Server running on port ${env.PORT}`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${env.PORT}/health`);
      logger.info(`📚 API endpoints:`);
      logger.info(`   • Authentication: http://localhost:${env.PORT}/api/auth`);
      logger.info(`   • Users: http://localhost:${env.PORT}/api/users`);
      logger.info(`   • Files: http://localhost:${env.PORT}/api/files`);
      logger.info(`   • Shops: http://localhost:${env.PORT}/api/shops`);
      logger.info(`   • Tenants: http://localhost:${env.PORT}/api/tenants`);
      logger.info(`   • Agreements: http://localhost:${env.PORT}/api/agreements`);
      logger.info(`   • Loans: http://localhost:${env.PORT}/api/loans`);
      logger.info(`   • Rent Penalties: http://localhost:${env.PORT}/api/rent-penalties`);
      logger.info(`   • Transactions: http://localhost:${env.PORT}/api/transactions`);
      logger.info(`   • Uploaded Files: http://localhost:${env.PORT}/api/uploaded-files`);
    });

    // Cleanup expired refresh tokens every hour
    setInterval(async () => {
      try {
        await RefreshToken.cleanupExpired();
      } catch (error) {
        logger.error('Failed to cleanup expired refresh tokens:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close((error) => {
      if (error) {
        logger.error('❌ Error during server shutdown:', error);
        process.exit(1);
      }
      logger.info('✅ Server closed');
    });
  }

  try {
    await closeDatabaseConnection();
    logger.info('✅ Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
  }

  logger.info('✅ Graceful shutdown completed');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();