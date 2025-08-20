import express from "express";
import helmet from "helmet";
import pino from "pino";
import pinoPretty from "pino-pretty";
import mysql from "mysql2/promise";
import env from "./src/config/env.js";
import corsMiddleware from "./src/middleware/cors.js";
import { defaultRateLimit } from "./src/middleware/rateLimit.js";
import {
  errorHandler,
  notFoundHandler,
  handleUncaughtException,
  handleUnhandledRejection,
} from "./src/middleware/error.js";

// Import routes
import authRoutes from "./src/routes/auth.js";
import userRoutes from "./src/routes/user.js";
import fileRoutes from "./src/routes/files.js";

// Import models
import { User } from "./src/models/User.js";
import { UploadedFile } from "./src/models/UploadedFile.js";
import { Shop } from "./src/models/Shop.js";
import { Tenant } from "./src/models/Tenant.js";
import { Agreement } from "./src/models/Agreement.js";
import { Loan } from "./src/models/Loan.js";
import { RentPenalty } from "./src/models/RentPenalty.js";
import { Transaction } from "./src/models/Transaction.js";

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

// Rate limiting
app.use(defaultRateLimit);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
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

// Health check (alternative endpoint for backward compatibility)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// User routes
app.get("/api/users", (req, res) => userController.getAll(req, res));
app.get("/api/users/:id", (req, res) => userController.getById(req, res));
app.post("/api/users", (req, res) => userController.create(req, res));
app.put("/api/users/:id", (req, res) => userController.update(req, res));
app.delete("/api/users/:id", (req, res) => userController.delete(req, res));

// Shop routes
app.get("/api/shops", (req, res) => shopController.getAll(req, res));
app.get("/api/shops/:id", (req, res) => shopController.getById(req, res));
app.post("/api/shops", (req, res) => shopController.create(req, res));
app.put("/api/shops/:id", (req, res) => shopController.update(req, res));
app.delete("/api/shops/:id", (req, res) => shopController.delete(req, res));

// Tenant routes
app.get("/api/tenants", (req, res) => tenantController.getAll(req, res));
app.get("/api/tenants/:id", (req, res) => tenantController.getById(req, res));
app.post("/api/tenants", (req, res) => tenantController.create(req, res));
app.put("/api/tenants/:id", (req, res) => tenantController.update(req, res));
app.delete("/api/tenants/:id", (req, res) => tenantController.delete(req, res));

// Agreement routes
app.get("/api/agreements", (req, res) => agreementController.getAll(req, res));
app.get("/api/agreements/:id", (req, res) =>
  agreementController.getById(req, res)
);
app.post("/api/agreements", (req, res) => agreementController.create(req, res));
app.put("/api/agreements/:id", (req, res) =>
  agreementController.update(req, res)
);
app.delete("/api/agreements/:id", (req, res) =>
  agreementController.delete(req, res)
);

// Loan routes
app.get("/api/loans", (req, res) => loanController.getAll(req, res));
app.get("/api/loans/:id", (req, res) => loanController.getById(req, res));
app.post("/api/loans", (req, res) => loanController.create(req, res));
app.put("/api/loans/:id", (req, res) => loanController.update(req, res));
app.delete("/api/loans/:id", (req, res) => loanController.delete(req, res));

// Rent Penalty routes
app.get("/api/rent-penalties", (req, res) =>
  rentPenaltyController.getAll(req, res)
);
app.get("/api/rent-penalties/:id", (req, res) =>
  rentPenaltyController.getById(req, res)
);
app.post("/api/rent-penalties", (req, res) =>
  rentPenaltyController.create(req, res)
);
app.put("/api/rent-penalties/:id", (req, res) =>
  rentPenaltyController.update(req, res)
);
app.delete("/api/rent-penalties/:id", (req, res) =>
  rentPenaltyController.delete(req, res)
);

// Transaction routes
app.get("/api/transactions", (req, res) =>
  transactionController.getAll(req, res)
);
app.get("/api/transactions/:id", (req, res) =>
  transactionController.getById(req, res)
);
app.post("/api/transactions", (req, res) =>
  transactionController.create(req, res)
);
app.put("/api/transactions/:id", (req, res) =>
  transactionController.update(req, res)
);
app.delete("/api/transactions/:id", (req, res) =>
  transactionController.delete(req, res)
);

// Uploaded File routes
app.get("/api/uploaded-files", (req, res) =>
  uploadedFileController.getAll(req, res)
);
app.get("/api/uploaded-files/:id", (req, res) =>
  uploadedFileController.getById(req, res)
);
app.post("/api/uploaded-files", (req, res) =>
  uploadedFileController.create(req, res)
);
app.put("/api/uploaded-files/:id", (req, res) =>
  uploadedFileController.update(req, res)
);
app.delete("/api/uploaded-files/:id", (req, res) =>
  uploadedFileController.delete(req, res)
);

// Additional useful endpoints

// Get files by entity
app.get(
  "/api/uploaded-files/entity/:entityType/:entityId",
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const rows = await query(
        "SELECT * FROM uploaded_files WHERE entity_type = ? AND entity_id = ?",
        [entityType, entityId]
      );
      const files = rows.map((row) => UploadedFile.fromDbRow(row));
      res.json(files);
    } catch (error) {
      logger.error("Get files by entity error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get transactions by type
app.get("/api/transactions/type/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const rows = await query(
      "SELECT * FROM transactions WHERE type = ? ORDER BY date DESC",
      [type]
    );
    const transactions = rows.map((row) => Transaction.fromDbRow(row));
    res.json(transactions);
  } catch (error) {
    logger.error("Get transactions by type error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get agreements by tenant
app.get("/api/agreements/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const rows = await query(
      "SELECT * FROM agreements WHERE tenant_id = ? ORDER BY created_at DESC",
      [tenantId]
    );
    const agreements = rows.map((row) => Agreement.fromDbRow(row));
    res.json(agreements);
  } catch (error) {
    logger.error("Get agreements by tenant error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get loans by agreement
app.get("/api/loans/agreement/:agreementId", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const rows = await query(
      "SELECT * FROM loans WHERE agreement_id = ? ORDER BY created_at DESC",
      [agreementId]
    );
    const loans = rows.map((row) => Loan.fromDbRow(row));
    res.json(loans);
  } catch (error) {
    logger.error("Get loans by agreement error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get penalties by agreement
app.get("/api/rent-penalties/agreement/:agreementId", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const rows = await query(
      "SELECT * FROM rent_penalties WHERE agreement_id = ? ORDER BY due_date DESC",
      [agreementId]
    );
    const penalties = rows.map((row) => RentPenalty.fromDbRow(row));
    res.json(penalties);
  } catch (error) {
    logger.error("Get penalties by agreement error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Export the additional tables function
export { createAdditionalTables };

export default app;
