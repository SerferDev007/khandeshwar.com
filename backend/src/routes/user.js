// routes/users.js
import express from "express";
import { validate, schemas } from "../middleware/validate.js";
import { requireRoles, authenticate } from "../middleware/auth.js";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from "../controllers/user.js";

const router = express.Router();

// Stats (Admin only)
router.get("/stats", ...requireRoles(["Admin"]), getUserStats);

// List users (Admin + Treasurer)
router.get(
  "/",
  ...requireRoles(["Admin", "Treasurer"]),
  // run validation after auth; validator should never throw
  validate(schemas.pagination),
  getAllUsers
);

// Get user by id (auth)
router.get("/:id", authenticate, validate(schemas.idParam), getUserById);

// Create (Admin only)
router.post(
  "/",
  ...requireRoles(["Admin"]),
  validate(schemas.register),
  createUser
);

// Update (auth)
router.put("/:id", authenticate, validate(schemas.updateUser), updateUser);

// Delete (Admin only)
router.delete(
  "/:id",
  ...requireRoles(["Admin"]),
  validate(schemas.idParam),
  deleteUser
);

export default router;
