import app, {
  createAdditionalTables,
  initializeSequelizeModels,
} from "./app.js";

import {
  initializeDatabase,
  closeDatabaseConnection,
} from "./src/config/db.js";

import { closeConnection as closeSequelizeConnection } from "./src/config/sequelize.js";
import { RefreshToken } from "./src/models/RefreshToken.js";
import env from "./src/config/env.js";

import pino from "pino";
import pinoPretty from "pino-pretty";

// --------------------------------------------------
// Logger (mirror logic in app.js for consistency)
// --------------------------------------------------
const logger = pino(
  env.NODE_ENV === "development"
    ? pinoPretty({
        translateTime: "yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
        colorize: true,
      })
    : {}
);

// --------------------------------------------------
// Liveness / Readiness (distinct from app.js /health)
// app.js already provides /health and /api/health
// --------------------------------------------------
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "OK", type: "liveness" });
});

app.get("/readiness", async (req, res) => {
  // Minimal readiness indicator (could be extended to do a lightweight query)
  res.status(200).json({
    status: "READY",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// --------------------------------------------------
// Server lifecycle
// --------------------------------------------------
let server;
let shuttingDown = false;

const startServer = async () => {
  try {
    logger.info(">> Initializing primary (non-Sequelize) database...");
    await initializeDatabase();
    logger.info(">> Running additional table creation (idempotent)...");
    await createAdditionalTables();
    logger.info(">> Initializing Sequelize models / connection...");
    await initializeSequelizeModels();

    const port = Number(env.PORT) || 3000;

    server = app.listen(port, "0.0.0.0", () => {
      logger.info(`>> Khandeshwar Management API Server running on port ${port}`);
      logger.info(`>> Environment: ${env.NODE_ENV}`);
      logger.info(">> Core health endpoints:");
      logger.info(`   * Liveness:        http://localhost:${port}/healthz`);
      logger.info(`   * Readiness:       http://localhost:${port}/readiness`);
      logger.info(`   * Health (JSON):   http://localhost:${port}/health`);
      logger.info(`   * Health (Legacy): http://localhost:${port}/api/health`);
      logger.info(">> API route groups:");
      logger.info(`   * Auth:            /api/auth`);
      logger.info(`   * Users:           /api/users`);
      logger.info(`   * Files:           /api/files`);
      logger.info(`   * Admin:           /api/admin`);
      logger.info(`   * Donations:       /api/donations`);
      logger.info(`   * Expenses:        /api/expenses`);
      logger.info(`   * Transactions:    /api/transactions`);
      logger.info(`   * Rent:            /api/rent`);
      logger.info(`   * Shops:           /api/shops`);
      logger.info(`   * Tenants:         /api/rent/tenants`);
      logger.info(`   * Agreements:      /api/rent/agreements`);
      logger.info(`   * Loans:           /api/loans`);
      logger.info(`   * Rent Penalties:  /api/rent-penalties`);
      logger.info(`   * Uploaded Files:  /api/uploaded-files`);
      logger.info(`   * Sequelize API:   /api/sequelize`);
    });

    // Refresh token cleanup job (hourly)
    setInterval(async () => {
      try {
        await RefreshToken.cleanupExpired();
      } catch (err) {
        logger.error({ err }, "Failed to cleanup expired refresh tokens");
      }
    }, 60 * 60 * 1000);
  } catch (error) {
    logger.error({ err: error }, ">> Failed to start server");
    process.exit(1);
  }
};

// --------------------------------------------------
// Graceful shutdown
// --------------------------------------------------
const gracefulShutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`>> Received ${signal}. Starting graceful shutdown...`);

  const closeHttpServer = () =>
    new Promise((resolve) => {
      if (!server) return resolve();
      server.close((err) => {
        if (err) {
          logger.error({ err }, ">> Error while closing HTTP server");
        } else {
          logger.info(">> HTTP server closed");
        }
        resolve();
      });
    });

  try {
    await closeHttpServer();

    try {
      await closeDatabaseConnection();
      logger.info(">> Primary database connection closed");
    } catch (err) {
      logger.error({ err }, ">> Error closing primary database connection");
    }

    try {
      await closeSequelizeConnection();
      logger.info(">> Sequelize connection closed");
    } catch (err) {
      logger.error({ err }, ">> Error closing Sequelize connection");
    }
  } catch (outerErr) {
    logger.error({ err: outerErr }, ">> Unexpected error during shutdown");
  } finally {
    logger.info(">> Graceful shutdown complete");
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// NOTE: Uncaught / unhandled handlers are already set in app.js via:
//   process.on("uncaughtException", handleUncaughtException);
//   process.on("unhandledRejection", handleUnhandledRejection);
// We intentionally do NOT duplicate them here.

// --------------------------------------------------
// Auto-start (if run directly)
// --------------------------------------------------
startServer();

// Optionally export for testing
export { startServer, gracefulShutdown };