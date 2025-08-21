import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { requireRoles } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/user.js';

const router = express.Router();

// All admin routes require admin role
router.use(...requireRoles(['Admin']));

// User management routes
router.get('/users/stats', getUserStats);
router.get('/users', validate(schemas.pagination), getAllUsers);
router.get('/users/:id', validate(schemas.idParam), getUserById);
router.post('/users', validate(schemas.register), createUser);
router.put('/users/:id', validate(schemas.updateUser), updateUser);
router.delete('/users/:id', validate(schemas.idParam), deleteUser);

export default router;