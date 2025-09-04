import express from 'express';
import { LoanController } from '../../controllers/sequelize/loanController.js';
import { validateBody, validateParams } from '../../middleware/joiValidation.js';
import { createLoanSchema, updateLoanSchema } from '../../validation/schemas.js';
import Joi from 'joi';

const router = express.Router();

// Parameter validation schema
const idSchema = Joi.object({
  id: Joi.string().length(36).required()
});

// GET /api/sequelize/loans - Get all loans
router.get('/', LoanController.getAll);

// GET /api/sequelize/loans/:id - Get loan by ID
router.get('/:id', 
  validateParams(idSchema),
  LoanController.getById
);

// POST /api/sequelize/loans - Create new loan
router.post('/', 
  validateBody(createLoanSchema),
  LoanController.create
);

// PUT /api/sequelize/loans/:id - Update loan
router.put('/:id',
  validateParams(idSchema),
  validateBody(updateLoanSchema),
  LoanController.update
);

// DELETE /api/sequelize/loans/:id - Delete loan
router.delete('/:id',
  validateParams(idSchema),
  LoanController.delete
);

export default router;