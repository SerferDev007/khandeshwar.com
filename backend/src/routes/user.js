import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize, requireRoles } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/user.js';

const router = express.Router();

// Get user statistics (Admin only)
router.get('/stats', ...requireRoles(['Admin']), getUserStats);

// Get all users (Admin only)  
router.get('/', ...requireRoles(['Admin']), validate(schemas.pagination), getAllUsers);

// Get user by ID (Admin or self)
router.get('/:id', authenticate, validate(schemas.idParam), getUserById);

// Create user (Admin only) - authenticate + authorize + validate
router.post('/', ...requireRoles(['Admin']), validate(schemas.register), createUser);

// Update user (Admin or self for basic fields)
router.put('/:id', authenticate, validate(schemas.updateUser), updateUser);

// Delete user (Admin only)
router.delete('/:id', ...requireRoles(['Admin']), validate(schemas.idParam), deleteUser);

export default router;