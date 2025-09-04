import express from 'express';
import { UploadedFileController } from '../../controllers/sequelize/uploadedFileController.js';
import { validateBody, validateParams } from '../../middleware/joiValidation.js';
import { createUploadedFileSchema, updateUploadedFileSchema } from '../../validation/schemas.js';
import Joi from 'joi';

const router = express.Router();

// Parameter validation schema
const idSchema = Joi.object({
  id: Joi.string().length(36).required()
});

// GET /api/sequelize/uploaded-files - Get all uploaded files
router.get('/', UploadedFileController.getAll);

// GET /api/sequelize/uploaded-files/:id - Get uploaded file by ID
router.get('/:id', 
  validateParams(idSchema),
  UploadedFileController.getById
);

// POST /api/sequelize/uploaded-files - Create new uploaded file
router.post('/', 
  validateBody(createUploadedFileSchema),
  UploadedFileController.create
);

// PUT /api/sequelize/uploaded-files/:id - Update uploaded file
router.put('/:id',
  validateParams(idSchema),
  validateBody(updateUploadedFileSchema),
  UploadedFileController.update
);

// DELETE /api/sequelize/uploaded-files/:id - Delete uploaded file
router.delete('/:id',
  validateParams(idSchema),
  UploadedFileController.delete
);

export default router;