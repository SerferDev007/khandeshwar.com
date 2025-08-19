import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { User } from "./src/models/User.js";
import { UploadedFile } from "./src/models/UploadedFile.js";
import { Shop } from "./src/models/Shop.js";
import { Tenant } from "./src/models/Tenant.js";
import { Agreement } from "./src/models/Agreement.js";
import { Loan } from "./src/models/Loan.js";
import { RentPenalty } from "./src/models/RentPenalty.js";
import { Transaction } from "./src/models/Transaction.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "khandeshwar_db",
  port: process.env.DB_PORT || 3306,
};

let connection;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to MySQL database");

    // Create database if it doesn't exist
    // await connection.execute(
    //   `CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`
    // );
    // await connection.execute(`USE ${dbConfig.database}`);

    // Create tables
    await createTables();
    console.log("Database tables created successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

// Create all tables
const createTables = async () => {
  const schemas = [
    User.getTableSchema(),
    Tenant.getTableSchema(),
    Shop.getTableSchema(),
    Agreement.getTableSchema(),
    Loan.getTableSchema(),
    RentPenalty.getTableSchema(),
    Transaction.getTableSchema(),
    UploadedFile.getTableSchema(),
  ];

  for (const schema of schemas) {
    await connection.execute(schema);
  }
};

// Utility function to generate UUID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Error handler middleware
const errorHandler = (error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
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
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
      );
      const entities = rows.map((row) => this.ModelClass.fromDbRow(row));
      res.json(entities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/{entity}/:id - Get by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Entity not found" });
      }

      const entity = this.ModelClass.fromDbRow(rows[0]);
      res.json(entity);
    } catch (error) {
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

      await connection.execute(
        `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`,
        values
      );

      res.status(201).json(entity);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // PUT /api/{entity}/:id - Update
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if entity exists
      const [existingRows] = await connection.execute(
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

      await connection.execute(
        `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
        [...values, id]
      );

      res.json(entity);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // DELETE /api/{entity}/:id - Delete
  async delete(req, res) {
    try {
      const { id } = req.params;

      const [result] = await connection.execute(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Entity not found" });
      }

      res.json({ message: "Entity deleted successfully" });
    } catch (error) {
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

// Health check
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
      const [rows] = await connection.execute(
        "SELECT * FROM uploaded_files WHERE entity_type = ? AND entity_id = ?",
        [entityType, entityId]
      );
      const files = rows.map((row) => UploadedFile.fromDbRow(row));
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get transactions by type
app.get("/api/transactions/type/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const [rows] = await connection.execute(
      "SELECT * FROM transactions WHERE type = ? ORDER BY date DESC",
      [type]
    );
    const transactions = rows.map((row) => Transaction.fromDbRow(row));
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agreements by tenant
app.get("/api/agreements/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const [rows] = await connection.execute(
      "SELECT * FROM agreements WHERE tenant_id = ? ORDER BY created_at DESC",
      [tenantId]
    );
    const agreements = rows.map((row) => Agreement.fromDbRow(row));
    res.json(agreements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get loans by agreement
app.get("/api/loans/agreement/:agreementId", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const [rows] = await connection.execute(
      "SELECT * FROM loans WHERE agreement_id = ? ORDER BY created_at DESC",
      [agreementId]
    );
    const loans = rows.map((row) => Loan.fromDbRow(row));
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get penalties by agreement
app.get("/api/rent-penalties/agreement/:agreementId", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const [rows] = await connection.execute(
      "SELECT * FROM rent_penalties WHERE agreement_id = ? ORDER BY due_date DESC",
      [agreementId]
    );
    const penalties = rows.map((row) => RentPenalty.fromDbRow(row));
    res.json(penalties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Temple Management API Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  if (connection) {
    await connection.end();
  }
  process.exit(0);
});

// Start the server
startServer();

export default app;
