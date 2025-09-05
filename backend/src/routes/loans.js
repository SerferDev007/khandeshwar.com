import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';
import { Loan } from '../models/Loan.js';
import { generateId } from '../utils/helpers.js';
import pino from 'pino';

const logger = pino({ name: 'loans-router' });
const router = express.Router();

// GET /api/loans - Get all loans
router.get('/', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM loans ORDER BY created_at DESC');
    const loans = rows.map(row => Loan.fromDbRow(row));
    
    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    logger.error('Get loans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loans'
    });
  }
});

// GET /api/loans/:id - Get loan by ID
router.get('/:id', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM loans WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    const loan = Loan.fromDbRow(rows[0]);
    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    logger.error('Get loan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loan'
    });
  }
});

// POST /api/loans - Create new loan
router.post('/', authenticate, authorize(['Admin', 'Treasurer']), async (req, res) => {
  try {
    const loanData = {
      ...req.body,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    const loan = new Loan(loanData);
    const dbObject = loan.toDbObject();

    const fields = Object.keys(dbObject).join(', ');
    const placeholders = Object.keys(dbObject).map(() => '?').join(', ');
    const values = Object.values(dbObject);

    await query(
      `INSERT INTO loans (${fields}) VALUES (${placeholders})`,
      values
    );

    res.status(201).json({
      success: true,
      data: loan
    });
  } catch (error) {
    logger.error('Create loan error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/loans/:id - Update loan
router.put('/:id', authenticate, authorize(['Admin', 'Treasurer']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if loan exists
    const existingRows = await query('SELECT * FROM loans WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    const loan = new Loan({ ...existingRows[0], ...updateData });
    const dbObject = loan.toDbObject();

    const setClause = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => dbObject[key]);

    await query(`UPDATE loans SET ${setClause} WHERE id = ?`, [...values, id]);

    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    logger.error('Update loan error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/loans/:id - Delete loan
router.delete('/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM loans WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    res.json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    logger.error('Delete loan error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;