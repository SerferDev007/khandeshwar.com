import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/user.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Get user statistics (Admin only)
router.get('/stats', authorize(['Admin']), getUserStats);

// Get all users (Admin only)
router.get('/', authorize(['Admin']), validate(schemas.pagination), getAllUsers);

// Get user by ID (Admin or self)
router.get('/:id', validate(schemas.idParam), getUserById);

// Create user (Admin only)
router.post('/', authorize(['Admin']), validate(schemas.register), createUser);

// Update user (Admin or self for basic fields)
router.put('/:id', validate(schemas.updateUser), updateUser);

// Delete user (Admin only)
router.delete('/:id', authorize(['Admin']), validate(schemas.idParam), deleteUser);

export default router;