import express from 'express';
import { TenantController } from '../../controllers/sequelize/tenantController.js';
import { validateBody, validateParams } from '../../middleware/joiValidation.js';
import { createTenantSchema, updateTenantSchema } from '../../validation/schemas.js';
import Joi from 'joi';

const router = express.Router();

// Parameter validation schema
const idSchema = Joi.object({
  id: Joi.string().length(36).required()
});

// GET /api/sequelize/tenants - Get all tenants
router.get('/', TenantController.getAll);

// GET /api/sequelize/tenants/:id - Get tenant by ID
router.get('/:id', 
  validateParams(idSchema),
  TenantController.getById
);

// POST /api/sequelize/tenants - Create new tenant
router.post('/', 
  validateBody(createTenantSchema),
  TenantController.create
);

// PUT /api/sequelize/tenants/:id - Update tenant
router.put('/:id',
  validateParams(idSchema),
  validateBody(updateTenantSchema),
  TenantController.update
);

// DELETE /api/sequelize/tenants/:id - Delete tenant
router.delete('/:id',
  validateParams(idSchema),
  TenantController.delete
);

export default router;