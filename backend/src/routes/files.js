import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
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

// All file routes require authentication
router.use(authenticate);

// Get file statistics (Admin only)
router.get('/stats', authorize(['Admin']), getFileStats);

// Get upload URL for new file
router.post('/upload-url', fileUploadRateLimit, validate(schemas.fileUpload), getUploadUrl);

// Confirm file upload completion
router.post('/:id/confirm', validate(schemas.idParam), confirmUpload);

// Get user's files
router.get('/my-files', validate(schemas.pagination), getUserFiles);

// Get all files (Admin only)
router.get('/', authorize(['Admin']), validate(schemas.pagination), getAllFiles);

// Get file by ID (with download URL)
router.get('/:id', validate(schemas.idParam), getFileById);

// Update file metadata
router.put('/:id', validate(schemas.idParam), updateFile);

// Delete file
router.delete('/:id', validate(schemas.idParam), deleteFileById);

export default router;