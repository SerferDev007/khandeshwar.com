import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { query } from '../config/db.js';
import { Transaction } from '../models/Transaction.js';
import { generateId } from '../utils/helpers.js';
import pino from 'pino';

const logger = pino({ name: 'transactions-router' });
const router = express.Router();

// Validation schemas using Zod
const transactionCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.enum(['Donation', 'Expense', 'Utilities', 'Salary', 'RentIncome']),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  receiptNumber: z.string().optional(),
  donorName: z.string().optional(),
  donorContact: z.string().regex(/^\d{10}$/, 'Contact must be 10 digits').optional().or(z.literal('')),
  familyMembers: z.coerce.number().int().positive().optional(),
  amountPerPerson: z.coerce.number().positive().optional(),
  vendor: z.string().optional(),
  receipt: z.string().optional(),
  tenantName: z.string().optional(),
  tenantContact: z.string().regex(/^\d{10}$/, 'Contact must be 10 digits').optional().or(z.literal('')),
  agreementId: z.string().optional(),
  shopNumber: z.string().optional(),
  payeeName: z.string().optional(),
  payeeContact: z.string().regex(/^\d{10}$/, 'Contact must be 10 digits').optional().or(z.literal('')),
  loanId: z.string().optional(),
  emiAmount: z.coerce.number().positive().optional(),
  penaltyId: z.string().optional(),
  penaltyAmount: z.coerce.number().positive().optional(),
});

const transactionUpdateSchema = transactionCreateSchema.partial();

// Middleware to validate transaction creation
const validateTransactionCreate = (req, res, next) => {
  try {
    req.body = transactionCreateSchema.parse(req.body);
    next();
  } catch (error) {
    logger.error('Transaction validation error:', error);
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// Middleware to validate transaction update
const validateTransactionUpdate = (req, res, next) => {
  try {
    req.body = transactionUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    logger.error('Transaction update validation error:', error);
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// GET /api/transactions - Get all transactions with optional type filter
router.get('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { type } = req.query;
    
    let sql = 'SELECT * FROM transactions';
    let params = [];
    
    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY date DESC, created_at DESC';
    
    const rows = await query(sql, params);
    const transactions = rows.map(row => Transaction.fromDbRow(row));
    
    return res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// GET /api/transactions/type/:type - Get transactions by type
router.get('/type/:type', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate transaction type
    if (!['Donation', 'Expense', 'Utilities', 'Salary', 'RentIncome'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction type'
      });
    }
    
    const rows = await query(
      'SELECT * FROM transactions WHERE type = ? ORDER BY date DESC, created_at DESC',
      [type]
    );
    const transactions = rows.map(row => Transaction.fromDbRow(row));
    
    return res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    logger.error('Get transactions by type error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// GET /api/transactions/:id - Get transaction by ID
router.get('/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    const transaction = Transaction.fromDbRow(rows[0]);
    return res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    logger.error('Get transaction by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction'
    });
  }
});

// POST /api/transactions - Create new transaction
router.post('/', authenticate, authorize(['Admin']), validateTransactionCreate, async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      id: generateId(),
    };
    
    const transaction = new Transaction(transactionData);
    const dbObject = transaction.toDbObject();

    const fields = Object.keys(dbObject).join(', ');
    const placeholders = Object.keys(dbObject)
      .map(() => '?')
      .join(', ');
    const values = Object.values(dbObject);

    await query(
      `INSERT INTO transactions (${fields}) VALUES (${placeholders})`,
      values
    );

    logger.info('Transaction created successfully:', { id: transaction.id, type: transaction.type, amount: transaction.amount });
    return res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    logger.error('Create transaction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create transaction'
    });
  }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), validateTransactionUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if transaction exists
    const existingRows = await query(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    const updatedTransaction = new Transaction({ ...existingRows[0], ...updateData });
    const dbObject = updatedTransaction.toDbObject();

    const setClause = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => dbObject[key]);

    await query(
      `UPDATE transactions SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    logger.info('Transaction updated successfully:', { id });
    return res.json({
      success: true,
      data: updatedTransaction
    });
  } catch (error) {
    logger.error('Update transaction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update transaction'
    });
  }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM transactions WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    logger.info('Transaction deleted successfully:', { id });
    return res.json({
      success: true,
      data: { message: 'Transaction deleted successfully' }
    });
  } catch (error) {
    logger.error('Delete transaction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete transaction'
    });
  }
});

export default router;