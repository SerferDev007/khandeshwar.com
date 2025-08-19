import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  changePassword,
  getProfile,
  updateProfile,
} from '../controllers/auth.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', authRateLimit, validate(schemas.register), register);
router.post('/login', authRateLimit, validate(schemas.login), login);
router.post('/refresh', validate(schemas.refreshToken), refreshToken);

// Protected routes
router.post('/logout', optionalAuth, logout);
router.post('/logout-all', authenticate, logoutAll);
router.post('/change-password', authenticate, validate(schemas.changePassword), changePassword);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(schemas.updateUser), updateProfile);

export default router;