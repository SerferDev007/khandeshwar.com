import express from 'express';
import { AgreementController } from '../../controllers/sequelize/agreementController.js';
import { validateBody, validateParams } from '../../middleware/joiValidation.js';
import { createAgreementSchema, updateAgreementSchema } from '../../validation/schemas.js';
import Joi from 'joi';

const router = express.Router();

// Parameter validation schema
const idSchema = Joi.object({
  id: Joi.string().length(36).required()
});

// GET /api/sequelize/agreements - Get all agreements
router.get('/', AgreementController.getAll);

// GET /api/sequelize/agreements/:id - Get agreement by ID
router.get('/:id', 
  validateParams(idSchema),
  AgreementController.getById
);

// POST /api/sequelize/agreements - Create new agreement
router.post('/', 
  validateBody(createAgreementSchema),
  AgreementController.create
);

// PUT /api/sequelize/agreements/:id - Update agreement
router.put('/:id',
  validateParams(idSchema),
  validateBody(updateAgreementSchema),
  AgreementController.update
);

// DELETE /api/sequelize/agreements/:id - Delete agreement
router.delete('/:id',
  validateParams(idSchema),
  AgreementController.delete
);

export default router;