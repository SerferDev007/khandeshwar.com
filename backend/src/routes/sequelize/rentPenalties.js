import express from 'express';
import { RentPenaltyController } from '../../controllers/sequelize/rentPenaltyController.js';
import { validateBody, validateParams } from '../../middleware/joiValidation.js';
import { createRentPenaltySchema, updateRentPenaltySchema } from '../../validation/schemas.js';
import Joi from 'joi';

const router = express.Router();

// Parameter validation schema
const idSchema = Joi.object({
  id: Joi.string().length(36).required()
});

// GET /api/sequelize/rent-penalties - Get all rent penalties
router.get('/', RentPenaltyController.getAll);

// GET /api/sequelize/rent-penalties/:id - Get rent penalty by ID
router.get('/:id', 
  validateParams(idSchema),
  RentPenaltyController.getById
);

// POST /api/sequelize/rent-penalties - Create new rent penalty
router.post('/', 
  validateBody(createRentPenaltySchema),
  RentPenaltyController.create
);

// PUT /api/sequelize/rent-penalties/:id - Update rent penalty
router.put('/:id',
  validateParams(idSchema),
  validateBody(updateRentPenaltySchema),
  RentPenaltyController.update
);

// DELETE /api/sequelize/rent-penalties/:id - Delete rent penalty
router.delete('/:id',
  validateParams(idSchema),
  RentPenaltyController.delete
);

export default router;