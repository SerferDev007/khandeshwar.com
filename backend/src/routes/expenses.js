import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { query } from '../config/db.js';
import { Transaction } from '../models/Transaction.js';
import pino from 'pino';

const logger = pino({ name: 'expenses-router' });
const router = express.Router();

// Validation schemas using Zod
const expenseCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  payeeName: z.string().min(1, 'Payee name is required'),
  payeeContact: z.string().regex(/^\d{10}$/, 'Contact must be 10 digits').optional().or(z.literal('')),
  receiptImages: z.array(z.string()).optional(),
});

const expenseUpdateSchema = expenseCreateSchema.partial();

// Middleware to validate expense creation
const validateExpenseCreate = (req, res, next) => {
  try {
    req.body = expenseCreateSchema.parse(req.body);
    next();
  } catch (error) {
    logger.error('Expense validation error:', error);
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// Middleware to validate expense update
const validateExpenseUpdate = (req, res, next) => {
  try {
    req.body = expenseUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    logger.error('Expense update validation error:', error);
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// GET /api/expenses - Get all expenses
router.get('/', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM transactions WHERE type = ? ORDER BY date DESC, created_at DESC',
      ['Expense']
    );
    const expenses = rows.map(row => Transaction.fromDbRow(row));
    
    return res.json({
      success: true,
      data: expenses
    });
  } catch (error) {
    logger.error('Get expenses error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses'
    });
  }
});

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      'SELECT * FROM transactions WHERE id = ? AND type = ?',
      [id, 'Expense']
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    const expense = Transaction.fromDbRow(rows[0]);
    return res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    logger.error('Get expense by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch expense'
    });
  }
});

// POST /api/expenses - Create new expense
router.post('/', authenticate, authorize(['Admin', 'Treasurer']), validateExpenseCreate, async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      id: generateId(),
      type: 'Expense',
      createdAt: new Date().toISOString(),
    };
    
    const expense = new Transaction(expenseData);
    const dbObject = expense.toDbObject();

    const fields = Object.keys(dbObject).join(', ');
    const placeholders = Object.keys(dbObject)
      .map(() => '?')
      .join(', ');
    const values = Object.values(dbObject);

    await query(
      `INSERT INTO transactions (${fields}) VALUES (${placeholders})`,
      values
    );

    logger.info('Expense created successfully:', { id: expense.id, amount: expense.amount });
    return res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    logger.error('Create expense error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create expense'
    });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', authenticate, authorize(['Admin', 'Treasurer']), validate(schemas.idParam), validateExpenseUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if expense exists
    const existingRows = await query(
      'SELECT * FROM transactions WHERE id = ? AND type = ?',
      [id, 'Expense']
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    const updatedExpense = new Transaction({ ...existingRows[0], ...updateData });
    const dbObject = updatedExpense.toDbObject();

    const setClause = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => dbObject[key]);

    await query(
      `UPDATE transactions SET ${setClause} WHERE id = ? AND type = ?`,
      [...values, id, 'Expense']
    );

    logger.info('Expense updated successfully:', { id });
    return res.json({
      success: true,
      data: updatedExpense
    });
  } catch (error) {
    logger.error('Update expense error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update expense'
    });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM transactions WHERE id = ? AND type = ?',
      [id, 'Expense']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    logger.info('Expense deleted successfully:', { id });
    return res.json({
      success: true,
      data: { message: 'Expense deleted successfully' }
    });
  } catch (error) {
    logger.error('Delete expense error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete expense'
    });
  }
});

export default router;