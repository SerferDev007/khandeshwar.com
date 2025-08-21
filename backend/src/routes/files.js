import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize, requireRoles } from '../middleware/auth.js';
import { fileUploadRateLimit } from '../middleware/rateLimit.js';
import {
  getUploadUrl,
  confirmUpload,
  getUserFiles,
  getAllFiles,
  getFileById,
  updateFile,
  deleteFileById,
  getFileStats,
} from '../controllers/file.js';

const router = express.Router();

// Get file statistics (Admin only)
router.get('/stats', ...requireRoles(['Admin']), getFileStats);

// Get upload URL for new file  
router.post('/upload-url', authenticate, fileUploadRateLimit, validate(schemas.fileUpload), getUploadUrl);

// Confirm file upload completion
router.post('/:id/confirm', authenticate, validate(schemas.idParam), confirmUpload);

// Get user's files
router.get('/my-files', authenticate, validate(schemas.pagination), getUserFiles);

// Get all files (Admin only)
router.get('/', ...requireRoles(['Admin']), validate(schemas.pagination), getAllFiles);

// Get file by ID (with download URL)
router.get('/:id', authenticate, validate(schemas.idParam), getFileById);

// Update file metadata
router.put('/:id', authenticate, validate(schemas.idParam), updateFile);

// Delete file
router.delete('/:id', authenticate, validate(schemas.idParam), deleteFileById);

export default router;