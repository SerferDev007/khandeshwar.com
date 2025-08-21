import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { requireRoles } from '../middleware/auth.js';

// Mock user controller functions for testing
const mockCreateUser = (req, res) => {
  const { username, email, password, role } = req.validatedData;
  
  // Mock validation - check for existing user
  if (email === 'existing@example.com') {
    return res.status(409).json({
      success: false,
      error: 'Email already registered'
    });
  }
  
  const newUser = {
    id: Date.now(),
    username,
    email,
    role: role || 'Viewer',
    status: 'Active',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: { user: newUser }
  });
};

const mockGetAllUsers = (req, res) => {
  res.json({
    success: true,
    data: { users: [], pagination: { total: 0, page: 1, limit: 10 } }
  });
};

const mockGetUserById = (req, res) => {
  res.json({
    success: true,
    data: { user: { id: req.params.id, username: 'test', email: 'test@example.com', role: 'Viewer' } }
  });
};

const mockUpdateUser = (req, res) => {
  res.json({
    success: true,
    data: { user: { id: req.params.id, ...req.validatedData } }
  });
};

const mockDeleteUser = (req, res) => {
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
};

const mockGetUserStats = (req, res) => {
  res.json({
    success: true,
    data: { stats: { total: 0, active: 0, inactive: 0, byRole: { Admin: 0, Treasurer: 0, Viewer: 0 } } }
  });
};

const router = express.Router();

// All admin routes require admin role
router.use(...requireRoles(['Admin']));

// User management routes
router.get('/users/stats', mockGetUserStats);
router.get('/users', validate(schemas.pagination), mockGetAllUsers);
router.get('/users/:id', validate(schemas.idParam), mockGetUserById);
router.post('/users', validate(schemas.register), mockCreateUser);
router.put('/users/:id', validate(schemas.updateUser), mockUpdateUser);
router.delete('/users/:id', validate(schemas.idParam), mockDeleteUser);

export default router;