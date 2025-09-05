import express from "express";
import helmet from "helmet";
import pino from "pino";
import pinoPretty from "pino-pretty";
import mysql from "mysql2/promise";
import env from "./src/config/env.js";
import corsMiddleware from "./src/middleware/cors.js";
import { defaultRateLimit, developmentRateLimit } from "./src/middleware/rateLimit.js";
import {
  errorHandler,
  notFoundHandler,
  handleUncaughtException,
  handleUnhandledRejection,
} from "./src/middleware/error.js";
import { activityLogger } from "./src/middleware/activityLogger.js";

// Import routes
import authRoutes from "./src/routes/auth.js";
import userRoutes from "./src/routes/user.js";
import fileRoutes from "./src/routes/files.js";
import adminRoutes from "./src/routes/admin.js";
import donationsRoutes from "./src/routes/donations.js";
import expensesRoutes from "./src/routes/expenses.js";
import transactionsRoutes from "./src/routes/transactions.js";
import rentRoutes from "./src/routes/rent.js";
import shopRoutes from "./src/routes/shop.js";
import loansRoutes from "./src/routes/loans.js";
import rentPenaltiesRoutes from "./src/routes/rentPenalties.js";

// Import Sequelize routes
import sequelizeRoutes from "./src/routes/sequelize/index.js";

// Import models
import { User } from "./src/models/User.js";
import { UploadedFile } from "./src/models/UploadedFile.js";
import { Shop } from "./src/models/Shop.js";
import { Tenant } from "./src/models/Tenant.js";
import { Agreement } from "./src/models/Agreement.js";
import { Loan } from "./src/models/Loan.js";
import { RentPenalty } from "./src/models/RentPenalty.js";
import { Transaction } from "./src/models/Transaction.js";

// Import Sequelize configuration
import { initializeSequelize } from "./src/config/sequelize.js";

// Create logger
const logger = pino(
  env.NODE_ENV === "development"
    ? pinoPretty({
        translateTime: "yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
        colorize: true,
      })
    : {}
);

// Global error handlers
process.on("uncaughtException", handleUncaughtException);
process.on("unhandledRejection", handleUnhandledRejection);

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Trust proxy for proper IP forwarding in production
app.set("trust proxy", 1);

// CORS
app.use(corsMiddleware);

// Rate limiting - use more lenient rate limiting in development
const rateLimit = env.NODE_ENV === 'development' ? developmentRateLimit : defaultRateLimit;
app.use(rateLimit);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Comprehensive route activity logging
app.use(activityLogger);

// Request logging (keep existing pino logger for compatibility)
app.use((req, res, next) => {
  logger.info(
    {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    },
    "Incoming request"
  );
  next();
});

// Database configuration
import { query } from "./src/config/db.js";

let connection;

// Create additional database tables
// Create additional tables for temple management models
const createAdditionalTables = async () => {
  const additionalSchemas = [
    Shop.getTableSchema(),
    Tenant.getTableSchema(),
    Agreement.getTableSchema(),
    Loan.getTableSchema(),
    RentPenalty.getTableSchema(),
    Transaction.getTableSchema(),
    UploadedFile.getTableSchema(),
  ];

  for (const schema of additionalSchemas) {
    try {
      await query(schema);
      logger.info("Additional table schema executed successfully");
    } catch (error) {
      logger.warn(
        "Additional table creation warning (may already exist):",
        error.message
      );
    }
  }
};

// Initialize Sequelize models and sync database
const initializeSequelizeModels = async () => {
  try {
    logger.info("Initializing Sequelize models...");
    await initializeSequelize();
    logger.info("✅ Sequelize models initialized successfully");
  } catch (error) {
    logger.error("❌ Failed to initialize Sequelize models:", error);
    throw error;
  }
};

// Utility function to generate UUID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Generic CRUD operations
class CrudController {
  constructor(tableName, ModelClass) {
    this.tableName = tableName;
    this.ModelClass = ModelClass;
  }

  // GET /api/{entity} - List all
  async getAll(req, res) {
    try {
      const rows = await query(
        `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
      );
      const entities = rows.map((row) => this.ModelClass.fromDbRow(row));
      res.json(entities);
    } catch (error) {
      logger.error("CRUD getAll error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/{entity}/:id - Get by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const rows = await query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [
        id,
      ]);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Entity not found" });
      }

      const entity = this.ModelClass.fromDbRow(rows[0]);
      res.json(entity);
    } catch (error) {
      logger.error("CRUD getById error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/{entity} - Create new
  async create(req, res) {
    try {
      const entityData = {
        ...req.body,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      const entity = new this.ModelClass(entityData);
      const dbObject = entity.toDbObject();

      const fields = Object.keys(dbObject).join(", ");
      const placeholders = Object.keys(dbObject)
        .map(() => "?")
        .join(", ");
      const values = Object.values(dbObject);

      await query(
        `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`,
        values
      );

      res.status(201).json(entity);
    } catch (error) {
      logger.error("CRUD create error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  // PUT /api/{entity}/:id - Update
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if entity exists
      const existingRows = await query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      if (existingRows.length === 0) {
        return res.status(404).json({ error: "Entity not found" });
      }

      const entity = new this.ModelClass({ ...existingRows[0], ...updateData });
      const dbObject = entity.toDbObject();

      const setClause = Object.keys(dbObject)
        .filter((key) => key !== "id" && key !== "created_at")
        .map((key) => `${key} = ?`)
        .join(", ");

      const values = Object.keys(dbObject)
        .filter((key) => key !== "id" && key !== "created_at")
        .map((key) => dbObject[key]);

      await query(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`, [
        ...values,
        id,
      ]);

      res.json(entity);
    } catch (error) {
      logger.error("CRUD update error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  // DELETE /api/{entity}/:id - Delete
  async delete(req, res) {
    try {
      const { id } = req.params;

      const result = await query(`DELETE FROM ${this.tableName} WHERE id = ?`, [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Entity not found" });
      }

      res.json({ message: "Entity deleted successfully" });
    } catch (error) {
      logger.error("CRUD delete error:", error);
      res.status(400).json({ error: error.message });
    }
  }
}

// Initialize controllers
const userController = new CrudController("users", User);
const shopController = new CrudController("shops", Shop);
const tenantController = new CrudController("tenants", Tenant);
const agreementController = new CrudController("agreements", Agreement);
const loanController = new CrudController("loans", Loan);
const rentPenaltyController = new CrudController("rent_penalties", RentPenalty);
const transactionController = new CrudController("transactions", Transaction);
const uploadedFileController = new CrudController(
  "uploaded_files",
  UploadedFile
);

// Routes

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "OK",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: env.NODE_ENV,
    },
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);

// New organized API routes with proper authentication and authorization
app.use("/api/donations", donationsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/rent", rentRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/loans", loansRoutes);
app.use("/api/rent-penalties", rentPenaltiesRoutes);


// Sequelize-based API routes (new implementation)
app.use("/api/sequelize", sequelizeRoutes);

// Health check (alternative endpoint for backward compatibility)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Note: User routes are handled by /api/users router with proper authentication
// The generic userController routes have been removed to prevent bypassing authentication

// Note: Entity-specific routes are handled by their respective protected routers:
// - Donations: /api/donations (protected)  
// - Expenses: /api/expenses (protected)
// - Rent management: /api/rent (protected - includes shops, tenants, agreements)
// 
// The generic controller routes below have been removed to prevent bypassing authentication:
// - /api/transactions (donations/expenses should use their specific endpoints)
// - /api/shops, /api/rent/tenants, /api/rent/agreements (should use /api/rent endpoints) 
// - /api/loans, /api/rent-penalties (currently unprotected - TODO: create protected routers)

// Note: All entity-specific routes have been removed to prevent bypassing authentication
// Protected routes are available through their respective routers:
// - File operations: /api/files (protected)
// - Donations: /api/donations (protected) 
// - Expenses: /api/expenses (protected)
// - Rent management: /api/rent (protected)

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Export the additional tables function
export { createAdditionalTables, initializeSequelizeModels };

export default app;
